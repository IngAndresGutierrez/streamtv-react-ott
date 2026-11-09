import { useEffect, useRef } from 'react';
import type { RemoteAction } from '../types/navigation';
import { mapKeyToAction } from './keys';

/** Return `true` when the action was handled, so the default is prevented. */
export type RemoteHandler = (action: RemoteAction, event: KeyboardEvent) => boolean | void;

/**
 * Subscribes to remote-control keys on `window`.
 *
 * - One listener per hook instance, removed on unmount or when disabled.
 * - The latest handler is read through a ref, so re-renders never re-bind the
 *   listener (avoids leaks and stale closures).
 */
export function useRemoteKeys(handler: RemoteHandler, enabled = true): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const action = mapKeyToAction(event);
      if (!action) return;
      const handled = handlerRef.current(action, event);
      if (handled !== false) {
        // Stops native scrolling, button "click on Enter" and browser back.
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
