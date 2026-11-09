import type { GridPosition } from '../types/navigation';

/**
 * Remembers the last focused position per screen so focus can be restored
 * after returning from a child screen (detail → home, player → detail).
 * Module-level on purpose: it must outlive the unmounted screen component.
 */
const memory = new Map<string, GridPosition>();

export function saveFocus(screenKey: string, position: GridPosition): void {
  memory.set(screenKey, position);
}

export function restoreFocus(screenKey: string): GridPosition | undefined {
  return memory.get(screenKey);
}

export function clearFocusMemory(): void {
  memory.clear();
}
