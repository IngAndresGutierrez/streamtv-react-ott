import { describe, expect, it } from 'vitest';
import { mapKeyToAction } from './keys';

const key = (init: Partial<KeyboardEvent>) =>
  ({ key: '', code: '', keyCode: 0, ctrlKey: false, metaKey: false, altKey: false, ...init }) as KeyboardEvent;

describe('mapKeyToAction', () => {
  it.each([
    ['ArrowUp', 'up'],
    ['ArrowDown', 'down'],
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
    ['Enter', 'select'],
    ['Escape', 'back'],
    ['Backspace', 'back'],
    ['MediaPlayPause', 'playPause'],
  ])('maps %s to %s', (k, action) => {
    expect(mapKeyToAction(key({ key: k }))).toBe(action);
  });

  it('maps D (any case / layout) to diagnostics via the physical code', () => {
    expect(mapKeyToAction(key({ key: 'd', code: 'KeyD' }))).toBe('diagnostics');
    expect(mapKeyToAction(key({ key: 'D', code: 'KeyD' }))).toBe('diagnostics');
  });

  it('falls back to TV vendor keyCodes (Tizen / webOS back)', () => {
    expect(mapKeyToAction(key({ key: 'Unidentified', keyCode: 10009 }))).toBe('back');
    expect(mapKeyToAction(key({ key: 'Unidentified', keyCode: 461 }))).toBe('back');
  });

  it('ignores browser shortcuts and unrelated keys', () => {
    expect(mapKeyToAction(key({ key: 'ArrowLeft', metaKey: true }))).toBeNull();
    expect(mapKeyToAction(key({ key: 'r', code: 'KeyR', ctrlKey: true }))).toBeNull();
    expect(mapKeyToAction(key({ key: 'x', code: 'KeyX' }))).toBeNull();
  });
});
