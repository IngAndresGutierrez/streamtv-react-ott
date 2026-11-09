export type Direction = 'up' | 'down' | 'left' | 'right';

/** Logical remote-control actions, decoupled from physical key codes. */
export type RemoteAction =
  | Direction
  | 'select'
  | 'back'
  | 'playPause'
  | 'play'
  | 'pause'
  | 'rewind'
  | 'fastForward'
  | 'diagnostics';

export interface GridPosition {
  row: number;
  col: number;
}

export type Screen =
  | { name: 'home' }
  | { name: 'detail'; titleId: string }
  | { name: 'player'; titleId: string; startTime?: number };
