import { describe, expect, it } from 'vitest';
import { clampPosition, moveFocus } from './focusGrid';

// hero (2 buttons), rail of 5, empty rail, rail of 3
const ROWS = [2, 5, 0, 3];

describe('moveFocus', () => {
  it('moves horizontally within a row', () => {
    expect(moveFocus(ROWS, { row: 1, col: 1 }, 'right')).toEqual({ row: 1, col: 2 });
    expect(moveFocus(ROWS, { row: 1, col: 1 }, 'left')).toEqual({ row: 1, col: 0 });
  });

  it('stops at horizontal edges instead of wrapping', () => {
    expect(moveFocus(ROWS, { row: 1, col: 0 }, 'left')).toEqual({ row: 1, col: 0 });
    expect(moveFocus(ROWS, { row: 1, col: 4 }, 'right')).toEqual({ row: 1, col: 4 });
  });

  it('stops at vertical edges', () => {
    expect(moveFocus(ROWS, { row: 0, col: 0 }, 'up')).toEqual({ row: 0, col: 0 });
    expect(moveFocus(ROWS, { row: 3, col: 0 }, 'down')).toEqual({ row: 3, col: 0 });
  });

  it('skips empty rows when moving vertically', () => {
    expect(moveFocus(ROWS, { row: 1, col: 0 }, 'down')).toEqual({ row: 3, col: 0 });
    expect(moveFocus(ROWS, { row: 3, col: 0 }, 'up')).toEqual({ row: 1, col: 0 });
  });

  it('clamps the column when the target row is shorter', () => {
    expect(moveFocus(ROWS, { row: 1, col: 4 }, 'up')).toEqual({ row: 0, col: 1 });
    expect(moveFocus(ROWS, { row: 1, col: 4 }, 'down')).toEqual({ row: 3, col: 2 });
  });

  it('restores the remembered column of the target row', () => {
    expect(moveFocus(ROWS, { row: 0, col: 0 }, 'down', { 1: 3 })).toEqual({ row: 1, col: 3 });
  });

  it('returns the input when the grid is empty', () => {
    expect(moveFocus([0, 0], { row: 0, col: 0 }, 'down')).toEqual({ row: 0, col: 0 });
  });
});

describe('clampPosition', () => {
  it('keeps valid positions untouched', () => {
    expect(clampPosition(ROWS, { row: 3, col: 2 })).toEqual({ row: 3, col: 2 });
  });

  it('clamps out-of-range columns and rows', () => {
    expect(clampPosition(ROWS, { row: 1, col: 99 })).toEqual({ row: 1, col: 4 });
    expect(clampPosition(ROWS, { row: 99, col: 0 })).toEqual({ row: 3, col: 0 });
  });

  it('moves off an empty row to the nearest non-empty row', () => {
    expect(clampPosition(ROWS, { row: 2, col: 1 })).toEqual({ row: 3, col: 1 });
  });

  it('returns null when nothing is focusable', () => {
    expect(clampPosition([], { row: 0, col: 0 })).toBeNull();
    expect(clampPosition([0], { row: 0, col: 0 })).toBeNull();
  });
});
