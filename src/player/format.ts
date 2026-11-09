export const NA = 'N/A';

const isKnown = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** 75 → "1:15", 3725 → "1:02:05". */
export function formatClock(seconds: number): string {
  if (!isKnown(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export function formatMs(ms: number | null | undefined): string {
  if (!isKnown(ms)) return NA;
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

export function formatBitrate(bps: number | null | undefined): string {
  if (!isKnown(bps) || bps <= 0) return NA;
  return bps >= 1e6 ? `${(bps / 1e6).toFixed(2)} Mbps` : `${Math.round(bps / 1e3)} kbps`;
}

export function formatCount(value: number | null | undefined): string {
  return isKnown(value) ? String(value) : NA;
}

export function formatResolution(width: number | null | undefined, height: number | null | undefined): string {
  return isKnown(width) && isKnown(height) && width > 0 && height > 0 ? `${width}×${height}` : NA;
}
