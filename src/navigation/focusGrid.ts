import type { Direction, GridPosition } from '../types/navigation';

/**
 * Pure spatial-navigation logic for a "rows of items" layout, which is how
 * most 10-foot UIs are organised (hero buttons, rails, control bars).
 *
 * `rows[i]` is the number of focusable items in row i. Empty rows are skipped.
 * `columnMemory` stores the last column visited per row so moving down and back
 * up returns to the same card (the behaviour users expect from TV apps).
 */
export type ColumnMemory = Readonly<Record<number, number>>;

export function isValidPosition(rows: readonly number[], pos: GridPosition): boolean {
  return pos.row >= 0 && pos.row < rows.length && pos.col >= 0 && pos.col < rows[pos.row];
}

/** Returns the nearest valid position, or null when the grid has no items. */
export function clampPosition(rows: readonly number[], pos: GridPosition): GridPosition | null {
  if (isValidPosition(rows, pos)) return pos;
  const start = Math.min(Math.max(pos.row, 0), rows.length - 1);
  // Search the requested row first, then outwards (down before up).
  for (let offset = 0; offset < rows.length; offset++) {
    for (const row of [start + offset, start - offset]) {
      if (row >= 0 && row < rows.length && rows[row] > 0) {
        return { row, col: Math.min(Math.max(pos.col, 0), rows[row] - 1) };
      }
    }
  }
  return null;
}

function findRow(rows: readonly number[], from: number, step: 1 | -1): number | null {
  for (let row = from + step; row >= 0 && row < rows.length; row += step) {
    if (rows[row] > 0) return row;
  }
  return null;
}

/**
 * Computes the next focus position. Returns the same position when the move
 * hits an edge (no wrap-around), so callers can detect "no movement".
 */
export function moveFocus(
  rows: readonly number[],
  current: GridPosition,
  direction: Direction,
  columnMemory: ColumnMemory = {},
): GridPosition {
  const pos = clampPosition(rows, current);
  if (!pos) return current;

  switch (direction) {
    case 'left':
      return pos.col > 0 ? { row: pos.row, col: pos.col - 1 } : pos;
    case 'right':
      return pos.col < rows[pos.row] - 1 ? { row: pos.row, col: pos.col + 1 } : pos;
    case 'up':
    case 'down': {
      const target = findRow(rows, pos.row, direction === 'down' ? 1 : -1);
      if (target === null) return pos;
      const remembered = columnMemory[target] ?? pos.col;
      return { row: target, col: Math.min(remembered, rows[target] - 1) };
    }
  }
}

export function samePosition(a: GridPosition, b: GridPosition): boolean {
  return a.row === b.row && a.col === b.col;
}
