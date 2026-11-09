import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';
import { ControlBar, ErrorDialog, LoadingIndicator, type ControlButton } from '../components/PlayerOverlay';
import { saveProgress } from '../data/watchProgress';
import { useGridNavigation } from '../navigation/useGridNavigation';
import { useDiagnostics } from '../player/useDiagnostics';
import { usePlayer, type UsePlayerOptions } from '../player/usePlayer';
import type { Title } from '../types/catalog';
import type { GridPosition, RemoteAction } from '../types/navigation';

interface PlayerPageProps {
  title: Title;
  startTime?: number;
  onBack: () => void;
  /** Injection point for tests. */
  createEngine?: UsePlayerOptions['createEngine'];
}

const SEEK_STEP_SEC = 10;
const VOLUME_STEP = 0.1;
const HIDE_CONTROLS_MS = 4000;
const PLAY_PAUSE_COL = 1;

export function PlayerPage({ title, startTime, onBack, createEngine }: PlayerPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onExit = useCallback((pos: number, dur: number) => saveProgress(title.id, pos, dur), [title.id]);
  const { state, tracker, engineRef, togglePlay, seekBy, changeVolume, toggleMute, retry } = usePlayer(videoRef, {
    url: title.stream.url,
    startTime,
    onExit,
    createEngine,
  });

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const diagnostics = useDiagnostics(showDiagnostics, tracker, engineRef, videoRef);

  // Auto-hide controls while playing; any key brings them back.
  const [controlsVisible, setControlsVisible] = useState(true);
  const [interaction, setInteraction] = useState(0);
  const isError = state.status === 'error';
  useEffect(() => {
    if (!controlsVisible || state.status !== 'playing') return;
    const id = window.setTimeout(() => setControlsVisible(false), HIDE_CONTROLS_MS);
    return () => window.clearTimeout(id);
  }, [controlsVisible, state.status, interaction]);

  const controls = useMemo<(ControlButton & { run: () => void })[]>(
    () => [
      { id: 'rewind', label: 'Retroceder 10 s', icon: '⟲', run: () => seekBy(-SEEK_STEP_SEC) },
      {
        id: 'play-pause',
        label: state.status === 'playing' || state.status === 'buffering' ? 'Pausar' : 'Reproducir',
        icon: state.status === 'playing' || state.status === 'buffering' ? '❚❚' : '▶',
        run: togglePlay,
      },
      { id: 'forward', label: 'Adelantar 10 s', icon: '⟳', run: () => seekBy(SEEK_STEP_SEC) },
      { id: 'volume-down', label: 'Bajar volumen', icon: '−', run: () => changeVolume(-VOLUME_STEP) },
      { id: 'volume-up', label: 'Subir volumen', icon: '+', run: () => changeVolume(VOLUME_STEP) },
      { id: 'mute', label: state.muted ? 'Activar sonido' : 'Silenciar', icon: state.muted ? '🔇' : '🔊', pressed: state.muted, run: toggleMute },
      { id: 'diagnostics', label: 'Diagnóstico', icon: 'ⓘ', pressed: showDiagnostics, run: () => setShowDiagnostics((v) => !v) },
    ],
    [state.status, state.muted, showDiagnostics, seekBy, togglePlay, changeVolume, toggleMute],
  );

  const handleSelect = useCallback(
    ({ col }: GridPosition) => {
      if (isError) {
        if (col === 0) retry();
        else onBack();
        return;
      }
      controls[col]?.run();
    },
    [isError, controls, retry, onBack],
  );

  const handleAction = useCallback(
    (action: RemoteAction) => {
      switch (action) {
        case 'diagnostics':
          setShowDiagnostics((v) => !v);
          return true;
        case 'playPause':
          togglePlay();
          return true;
        case 'play':
          if (videoRef.current?.paused) togglePlay();
          return true;
        case 'pause':
          if (videoRef.current && !videoRef.current.paused) togglePlay();
          return true;
        case 'rewind':
          seekBy(-SEEK_STEP_SEC);
          return true;
        case 'fastForward':
          seekBy(SEEK_STEP_SEC);
          return true;
        default:
          return false;
      }
    },
    [togglePlay, seekBy],
  );

  const handleBeforeKey = useCallback(
    (action: RemoteAction) => {
      setInteraction((n) => n + 1);
      if (controlsVisible || isError) return false;
      setControlsVisible(true);
      // First D-pad press only reveals the controls (standard TV behaviour).
      return ['up', 'down', 'left', 'right', 'select'].includes(action);
    },
    [controlsVisible, isError],
  );

  const { getItemProps } = useGridNavigation({
    rows: isError ? [2] : [controls.length],
    // Error dialog → focus "Retry"; controls → focus "Play/Pause".
    initialFocus: { row: 0, col: isError ? 0 : PLAY_PAUSE_COL },
    resetKey: isError ? 'error' : 'controls',
    onSelect: handleSelect,
    onBack,
    onAction: handleAction,
    onBeforeKey: handleBeforeKey,
    scrollIntoView: () => {},
  });

  // Pointer users (desktop mouse, LG Magic Remote) also reveal the controls.
  useEffect(() => {
    const reveal = () => {
      setControlsVisible(true);
      setInteraction((n) => n + 1);
    };
    window.addEventListener('pointermove', reveal);
    return () => window.removeEventListener('pointermove', reveal);
  }, []);

  const showSpinner = state.status === 'loading' || state.status === 'buffering';

  return (
    <main className="player" data-testid="player-page" data-status={state.status}>
      {/* Captions/subtitles arrive inside the DASH/HLS manifest and are handled by Shaka, not <track>. */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} className="player__video" playsInline aria-label={`Video: ${title.title}`} data-testid="player-video" />

      {showSpinner && <LoadingIndicator label={state.status === 'loading' ? 'Cargando…' : 'Buffering…'} />}

      {state.autoplayMuted && !isError && (
        <p className="player-toast" role="status">
          Reproducción iniciada sin sonido por la política de autoplay del navegador. Usa «Activar sonido».
        </p>
      )}

      {isError && state.error ? (
        <ErrorDialog
          message={state.error.message}
          code={`${state.error.category} · ${state.error.code}`}
          retryProps={getItemProps(0, 0)}
          backProps={getItemProps(0, 1)}
        />
      ) : (
        <ControlBar
          title={title.title}
          state={state}
          controls={controls}
          getItemProps={(col) => getItemProps(0, col)}
          visible={controlsVisible || state.status !== 'playing'}
        />
      )}

      {showDiagnostics && <DiagnosticsPanel data={diagnostics} stream={title.stream} status={state.status} />}
    </main>
  );
}
