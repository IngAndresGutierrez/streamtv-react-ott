import type { RemoteAction } from '../types/navigation';

/**
 * On-screen remote buttons. Each one dispatches the same keyboard event a
 * physical key would, so the app has a single input path (`useRemoteKeys`).
 */
export interface VirtualKey {
  action: RemoteAction;
  label: string;
  hint: string;
  init: KeyboardEventInit;
}

export const VIRTUAL_KEYS: Record<string, VirtualKey> = {
  up: { action: 'up', label: '▲', hint: 'Arriba (↑)', init: { key: 'ArrowUp', code: 'ArrowUp' } },
  down: { action: 'down', label: '▼', hint: 'Abajo (↓)', init: { key: 'ArrowDown', code: 'ArrowDown' } },
  left: { action: 'left', label: '◀', hint: 'Izquierda (←)', init: { key: 'ArrowLeft', code: 'ArrowLeft' } },
  right: { action: 'right', label: '▶', hint: 'Derecha (→)', init: { key: 'ArrowRight', code: 'ArrowRight' } },
  select: { action: 'select', label: 'OK', hint: 'Seleccionar (Enter)', init: { key: 'Enter', code: 'Enter' } },
  back: { action: 'back', label: '↩', hint: 'Volver (Esc)', init: { key: 'Escape', code: 'Escape' } },
  diagnostics: { action: 'diagnostics', label: 'D', hint: 'Diagnóstico QoE (D)', init: { key: 'd', code: 'KeyD' } },
  rewind: { action: 'rewind', label: '«10', hint: 'Retroceder 10 s', init: { key: 'MediaRewind', code: 'MediaRewind' } },
  playPause: { action: 'playPause', label: '▶︎❚❚', hint: 'Reproducir / pausar (Espacio)', init: { key: 'MediaPlayPause', code: 'MediaPlayPause' } },
  fastForward: { action: 'fastForward', label: '10»', hint: 'Adelantar 10 s', init: { key: 'MediaFastForward', code: 'MediaFastForward' } },
};

export function pressVirtualKey(key: VirtualKey): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { ...key.init, bubbles: true, cancelable: true }));
}
