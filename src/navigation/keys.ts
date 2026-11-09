import type { RemoteAction } from '../types/navigation';

/**
 * Maps physical keys to logical remote actions.
 *
 * `key` values cover desktop keyboards and most modern TV browsers.
 * `keyCode` values are a fallback for platforms that report `Unidentified`
 * keys. The Tizen/webOS codes below come from vendor documentation and have
 * NOT been validated on real hardware in this project.
 */
const BY_KEY: Record<string, RemoteAction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'select',
  Escape: 'back',
  Backspace: 'back',
  GoBack: 'back',
  BrowserBack: 'back',
  MediaPlayPause: 'playPause',
  MediaPlay: 'play',
  MediaPause: 'pause',
  MediaRewind: 'rewind',
  MediaFastForward: 'fastForward',
  ' ': 'playPause',
};

const BY_KEY_CODE: Record<number, RemoteAction> = {
  10009: 'back', // Samsung Tizen "Return"
  461: 'back', // LG webOS "Back"
  10252: 'playPause', // Tizen MediaPlayPause
  415: 'play',
  19: 'pause',
  412: 'rewind',
  417: 'fastForward',
};

/** Only `D` toggles diagnostics; letters are not remote keys otherwise. */
const BY_CODE: Record<string, RemoteAction> = {
  KeyD: 'diagnostics',
};

export function mapKeyToAction(event: Pick<KeyboardEvent, 'key' | 'code' | 'keyCode' | 'ctrlKey' | 'metaKey' | 'altKey'>): RemoteAction | null {
  // Leave browser shortcuts (Ctrl+R, Cmd+L, ...) alone.
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  return BY_KEY[event.key] ?? BY_CODE[event.code] ?? BY_KEY_CODE[event.keyCode] ?? null;
}
