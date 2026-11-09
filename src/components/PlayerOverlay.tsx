import type { FocusableProps } from '../navigation/useGridNavigation';
import { formatClock } from '../player/format';
import type { PlayerState } from '../player/usePlayer';

export interface ControlButton {
  id: string;
  label: string;
  icon: string;
  pressed?: boolean;
}

interface ControlBarProps {
  title: string;
  state: PlayerState;
  controls: ControlButton[];
  getItemProps: (col: number) => FocusableProps;
  visible: boolean;
}

export function ControlBar({ title, state, controls, getItemProps, visible }: ControlBarProps) {
  const { currentTime, duration } = state;
  return (
    <div className={`controls${visible ? '' : ' controls--hidden'}`} data-testid="player-controls">
      <h1 className="controls__title">{title}</h1>
      <div className="controls__timeline">
        <span data-testid="player-time">{formatClock(currentTime)}</span>
        <progress
          className="timeline"
          aria-label="Progreso de reproducción"
          aria-valuetext={`${formatClock(currentTime)} de ${formatClock(duration)}`}
          max={duration > 0 ? duration : 1}
          value={duration > 0 ? Math.min(currentTime, duration) : 0}
        />
        <span>{formatClock(duration)}</span>
      </div>
      <div className="controls__buttons" role="toolbar" aria-label="Controles del reproductor">
        {controls.map((control, col) => (
          <button
            key={control.id}
            type="button"
            className="control"
            aria-label={control.label}
            aria-pressed={control.pressed}
            data-testid={`control-${control.id}`}
            {...getItemProps(col)}
          >
            <span aria-hidden="true" className="control__icon">
              {control.icon}
            </span>
            <span aria-hidden="true" className="control__label">
              {control.label}
            </span>
          </button>
        ))}
        <span className="controls__volume" aria-live="polite">
          Volumen {state.muted ? 'silenciado' : `${Math.round(state.volume * 100)}%`}
        </span>
      </div>
    </div>
  );
}

export function LoadingIndicator({ label }: { label: string }) {
  return (
    <div className="player-status" role="status" data-testid="player-loading">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

interface ErrorDialogProps {
  message: string;
  code: string;
  retryProps: FocusableProps;
  backProps: FocusableProps;
}

export function ErrorDialog({ message, code, retryProps, backProps }: ErrorDialogProps) {
  return (
    <div className="player-error" role="alert" data-testid="player-error">
      <h2>No pudimos reproducir este contenido</h2>
      <p>{message}</p>
      <p className="player-error__code">Código: {code}</p>
      <div className="actions">
        <button type="button" className="btn btn--primary" data-testid="player-retry" {...retryProps}>
          ↻ Reintentar
        </button>
        <button type="button" className="btn" data-testid="player-error-back" {...backProps}>
          Volver
        </button>
      </div>
    </div>
  );
}
