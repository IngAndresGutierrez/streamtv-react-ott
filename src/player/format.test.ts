import { describe, expect, it } from 'vitest';
import { NA, formatBitrate, formatClock, formatCount, formatMs, formatResolution } from './format';

describe('format helpers', () => {
  it('formats clock times', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(75.9)).toBe('1:15');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(Number.NaN)).toBe('0:00');
  });

  it('renders unknown metrics as N/A instead of inventing values', () => {
    expect(formatMs(null)).toBe(NA);
    expect(formatMs(Number.NaN)).toBe(NA);
    expect(formatBitrate(Number.NaN)).toBe(NA);
    expect(formatBitrate(0)).toBe(NA);
    expect(formatCount(undefined)).toBe(NA);
    expect(formatResolution(Number.NaN, 720)).toBe(NA);
  });

  it('formats known metrics', () => {
    expect(formatMs(420)).toBe('420 ms');
    expect(formatMs(1870)).toBe('1.87 s');
    expect(formatBitrate(991_000)).toBe('991 kbps');
    expect(formatBitrate(4_760_000)).toBe('4.76 Mbps');
    expect(formatCount(0)).toBe('0');
    expect(formatResolution(1280, 720)).toBe('1280×720');
  });
});
