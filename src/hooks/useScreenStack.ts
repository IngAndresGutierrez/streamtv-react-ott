import { useCallback, useState } from 'react';
import type { Screen } from '../types/navigation';

/**
 * Minimal screen history. A TV app has no URL bar, so a stack is enough and
 * avoids pulling in a router. Only the top screen is mounted, which frees the
 * player and its media resources as soon as the user goes back.
 */
export function useScreenStack(initial: Screen = { name: 'home' }) {
  const [stack, setStack] = useState<Screen[]>([initial]);

  const push = useCallback((screen: Screen) => setStack((s) => [...s, screen]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  return { current: stack[stack.length - 1], depth: stack.length, push, back };
}
