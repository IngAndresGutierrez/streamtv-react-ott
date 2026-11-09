import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { QoeTracker } from './qoe';
import { createShakaEngine, isLoadInterrupted, UnsupportedPlatformError, type EngineError, type PlaybackEngine } from './shakaEngine';

export type PlaybackStatus = 'loading' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

export interface PlayerState {
  status: PlaybackStatus;
  error: EngineError | null;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  /** Autoplay with sound was blocked, playback started muted. */
  autoplayMuted: boolean;
}

export interface UsePlayerOptions {
  url: string;
  startTime?: number;
  /** Called once on unmount with the last known position (for "continue watching"). */
  onExit?: (positionSec: number, durationSec: number) => void;
  /** Injection point for tests. */
  createEngine?: typeof createShakaEngine;
}

const SEEK_MARGIN_SEC = 0.5;

const INITIAL: PlayerState = {
  status: 'loading',
  error: null,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  autoplayMuted: false,
};

/**
 * Owns the playback lifecycle: create engine → load → autoplay → teardown.
 * UI components only consume `state` and the command callbacks.
 */
export function usePlayer(videoRef: RefObject<HTMLVideoElement | null>, options: UsePlayerOptions) {
  const { url, startTime, createEngine = createShakaEngine } = options;
  const [state, setState] = useState<PlayerState>(INITIAL);
  const [attempt, setAttempt] = useState(0);

  const engineRef = useRef<PlaybackEngine | null>(null);
  const teardownRef = useRef<Promise<unknown>>(Promise.resolve());
  const [tracker] = useState(() => new QoeTracker());
  const trackerRef = useRef(tracker);
  const started = useRef(false);
  const buffering = useRef(false);
  const position = useRef({ time: startTime ?? 0, duration: 0 });
  const onExitRef = useRef(options.onExit);
  useEffect(() => {
    onExitRef.current = options.onExit;
  });

  const patch = useCallback((partial: Partial<PlayerState>) => setState((s) => ({ ...s, ...partial })), []);

  const fail = useCallback(
    (error: EngineError) => {
      trackerRef.current.error(error.code, error.message, error.fatal);
      if (error.fatal) patch({ status: 'error', error });
    },
    [patch],
  );

  // 1) Engine lifecycle. Re-runs on retry (attempt) or when the source changes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let engine: PlaybackEngine | null = null;
    const tracker = trackerRef.current;

    started.current = false;
    buffering.current = false;
    tracker.loadStarted();
    patch({ status: 'loading', error: null });

    const resumeAt = position.current.time > 0 ? position.current.time : undefined;
    // A previous engine (retry, StrictMode remount) may still be detaching from
    // this same <video>. Attaching before it finishes lets its teardown clear
    // our MediaSource, leaving playback stuck in "loading".
    const previousTeardown = teardownRef.current;

    const run = async () => {
      await previousTeardown;
      if (cancelled) return;
      const created = await createEngine(video, {
        onError: (error) => !cancelled && fail(error),
        onBuffering: (isBuffering) => {
          if (cancelled) return;
          buffering.current = isBuffering;
          tracker.bufferingChanged(isBuffering);
          if (started.current) {
            setState((s) => (s.status === 'error' ? s : { ...s, status: isBuffering ? 'buffering' : video.paused ? 'paused' : 'playing' }));
          }
        },
      });
      if (cancelled) {
        await created.destroy();
        return;
      }
      engine = created;
      engineRef.current = created;
      await created.load(url, resumeAt);
      if (cancelled) return;
      try {
        await video.play();
      } catch (error) {
        // Chrome/TV autoplay policies may block audible playback: retry muted.
        if (cancelled || (error as DOMException).name !== 'NotAllowedError') return;
        video.muted = true;
        patch({ autoplayMuted: true });
        await video.play().catch(() => patch({ status: 'paused' }));
      }
    };

    const running = run().catch((error: unknown) => {
      if (cancelled || isLoadInterrupted(error)) return;
      if (error instanceof UnsupportedPlatformError) {
        fail({ code: 'MSE_UNSUPPORTED', category: 'PLATFORM', message: error.message, fatal: true });
      } else if (!(error && typeof error === 'object' && 'category' in error)) {
        // Shaka errors were already reported by the engine; this is anything else.
        fail({ code: 'UNKNOWN', category: 'PLAYER', message: 'No se pudo iniciar el reproductor.', fatal: true });
      }
    });

    return () => {
      cancelled = true;
      engineRef.current = null;
      // Destroy now if attached (this also interrupts an in-flight load);
      // otherwise wait for `run` to finish, which destroys the late engine itself.
      teardownRef.current = (engine ? engine.destroy() : running).catch(() => undefined);
    };
  }, [url, attempt, createEngine, fail, patch, videoRef]);

  // 2) <video> element events → UI state + QoE. Bound once per element.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracker = trackerRef.current;
    const sync = () => {
      position.current = { time: video.currentTime, duration: Number.isFinite(video.duration) ? video.duration : 0 };
      patch({ currentTime: position.current.time, duration: position.current.duration });
    };
    const onPlaying = () => {
      if (!started.current) {
        started.current = true;
        tracker.firstFrame();
      }
      setState((s) => (s.status === 'error' ? s : { ...s, status: buffering.current ? 'buffering' : 'playing' }));
    };
    const onPause = () => setState((s) => (s.status === 'error' || !started.current ? s : { ...s, status: 'paused' }));
    const onEnded = () => setState((s) => (s.status === 'error' ? s : { ...s, status: 'ended' }));
    const onVolume = () => patch({ volume: video.volume, muted: video.muted });

    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', sync);
    video.addEventListener('durationchange', sync);
    video.addEventListener('seeked', sync);
    video.addEventListener('volumechange', onVolume);
    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', sync);
      video.removeEventListener('durationchange', sync);
      video.removeEventListener('seeked', sync);
      video.removeEventListener('volumechange', onVolume);
    };
  }, [patch, videoRef]);

  // 3) Report the last position exactly once, when the player screen unmounts.
  useEffect(
    () => () => {
      const { time, duration } = position.current;
      if (started.current) onExitRef.current?.(time, duration);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !started.current) return;
    if (video.paused || video.ended) void video.play().catch(() => undefined);
    else video.pause();
  }, [videoRef]);

  const seekBy = useCallback(
    (deltaSec: number) => {
      const video = videoRef.current;
      if (!video || !started.current || !Number.isFinite(video.duration)) return;
      video.currentTime = Math.min(Math.max(0, video.currentTime + deltaSec), Math.max(0, video.duration - SEEK_MARGIN_SEC));
    },
    [videoRef],
  );

  const changeVolume = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.volume = Math.round(Math.min(1, Math.max(0, video.volume + delta)) * 10) / 10;
      if (video.muted && delta > 0) video.muted = false;
      patch({ autoplayMuted: false });
    },
    [videoRef, patch],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    patch({ autoplayMuted: false });
  }, [videoRef, patch]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, tracker, engineRef, togglePlay, seekBy, changeVolume, toggleMute, retry };
}
