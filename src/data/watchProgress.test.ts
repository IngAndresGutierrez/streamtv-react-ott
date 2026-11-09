import { describe, expect, it } from 'vitest';
import { getProgress, listProgress, saveProgress } from './watchProgress';

describe('watchProgress', () => {
  it('starts with seed data so "Continue watching" is not empty', () => {
    expect(listProgress().length).toBeGreaterThan(0);
  });

  it('saves a position and lists it first', () => {
    saveProgress('noches-de-lima', 120, 600);
    expect(listProgress()[0]).toMatchObject({ titleId: 'noches-de-lima', positionSec: 120 });
  });

  it('removes titles watched almost to the end or barely started', () => {
    saveProgress('sintel', 880, 888);
    expect(getProgress('sintel')).toBeUndefined();
    saveProgress('noches-de-lima', 2, 600);
    expect(getProgress('noches-de-lima')).toBeUndefined();
  });

  it('ignores invalid durations (e.g. live or not loaded)', () => {
    saveProgress('orbita-baja', 30, Number.NaN);
    expect(getProgress('orbita-baja')).toBeUndefined();
  });
});
