import { useEffect, useState, type RefObject } from 'react';
import { readFrameStats, type QoeSnapshot, type QoeTracker } from './qoe';
import type { EngineStats, PlaybackEngine } from './shakaEngine';

export interface Diagnostics {
  qoe: QoeSnapshot;
  engine: EngineStats | null;
  engineVersion: string | null;
  bufferAheadSec: number | null;
}

const POLL_MS = 1000;

function bufferAhead(video: HTMLVideoElement): number | null {
  const { buffered, currentTime } = video;
  for (let i = 0; i < buffered.length; i++) {
    if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) return buffered.end(i) - currentTime;
  }
  return buffered.length > 0 ? 0 : null;
}

/**
 * Polls metrics only while the panel is visible, so diagnostics cost nothing
 * during normal playback. Event-based metrics (startup, rebuffering, errors)
 * are collected by the tracker regardless of the panel.
 */
export function useDiagnostics(
  enabled: boolean,
  tracker: QoeTracker,
  engineRef: RefObject<PlaybackEngine | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
): Diagnostics | null {
  const [data, setData] = useState<Diagnostics | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const collect = () => {
      const video = videoRef.current;
      const engine = engineRef.current;
      const engineStats = engine?.getStats() ?? null;
      // Prefer the standard API; fall back to Shaka's counters; otherwise N/A.
      let frames = video ? readFrameStats(video) : null;
      if (!frames && engineStats && Number.isFinite(engineStats.droppedFrames) && Number.isFinite(engineStats.decodedFrames)) {
        frames = { dropped: engineStats.droppedFrames, total: engineStats.decodedFrames };
      }
      tracker.setFrames(frames);
      setData({
        qoe: tracker.snapshot(),
        engine: engineStats,
        engineVersion: engine?.version ?? null,
        bufferAheadSec: video ? bufferAhead(video) : null,
      });
    };
    collect();
    const id = window.setInterval(collect, POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, tracker, engineRef, videoRef]);

  return enabled ? data : null;
}
