import type { PlaybackStatus } from './usePlayer';

export const STATUS_LABEL: Record<PlaybackStatus, string> = {
  loading: 'Cargando',
  playing: 'Reproduciendo',
  paused: 'En pausa',
  buffering: 'Buffering',
  ended: 'Finalizado',
  error: 'Error',
};
