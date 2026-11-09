import { useEffect, useState, type MouseEvent } from 'react';
import { mapKeyToAction } from '../navigation/keys';
import { VIRTUAL_KEYS, pressVirtualKey, type VirtualKey } from '../navigation/virtualRemote';
import type { RemoteAction } from '../types/navigation';

const FLASH_MS = 160;

/**
 * Clickable remote for mouse demos. It is a simulation device, so it is hidden
 * from assistive tech and never takes focus: the keyboard remains the
 * accessible path and the app keeps its D-pad focus while you click.
 */
export function RemoteControl() {
  const [pressed, setPressed] = useState<RemoteAction | null>(null);

  // Light up the matching button for physical keys too (single input path).
  useEffect(() => {
    let timer: number | undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const action = mapKeyToAction(event);
      if (!action) return;
      setPressed(action);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setPressed(null), FLASH_MS);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, []);

  const button = (id: keyof typeof VIRTUAL_KEYS, className: string) => {
    const key: VirtualKey = VIRTUAL_KEYS[id];
    return (
      <button
        type="button"
        tabIndex={-1}
        title={key.hint}
        className={`remote__btn ${className}${pressed === key.action ? ' is-pressed' : ''}`}
        data-testid={`remote-${id}`}
        // Keep DOM focus on the app's focused item while clicking.
        onMouseDown={(event: MouseEvent) => event.preventDefault()}
        onClick={() => pressVirtualKey(key)}
      >
        {key.label}
      </button>
    );
  };

  return (
    <div className="remote" aria-hidden="true" data-testid="remote-control">
      <div className="remote__top">
        <span className="remote__led" />
        <span className="remote__ir" />
      </div>
      <div className="remote__dpad">
        {button('up', 'remote__dir remote__dir--up')}
        {button('left', 'remote__dir remote__dir--left')}
        {button('select', 'remote__ok')}
        {button('right', 'remote__dir remote__dir--right')}
        {button('down', 'remote__dir remote__dir--down')}
      </div>
      <div className="remote__row">
        {button('back', 'remote__round')}
        {button('diagnostics', 'remote__round remote__round--accent')}
      </div>
      <div className="remote__row remote__row--media">
        {button('rewind', 'remote__pill')}
        {button('playPause', 'remote__pill')}
        {button('fastForward', 'remote__pill')}
      </div>
      <p className="remote__brand">
        Stream<span>TV</span>
      </p>
    </div>
  );
}
