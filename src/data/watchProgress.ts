/**
 * "Continue watching" persistence. Uses localStorage when available and
 * degrades to an in-memory map (private mode, quota errors, some TV webviews).
 */
export interface WatchProgress {
  titleId: string;
  positionSec: number;
  durationSec: number;
  updatedAt: number;
}

const STORAGE_KEY = 'streamtv:progress:v1';
/** Ignore positions too close to the start or end. */
const MIN_POSITION_SEC = 5;
const END_THRESHOLD = 0.95;

/** Seed so the row is not empty on first launch. */
const SEED: WatchProgress[] = [
  { titleId: 'sintel', positionSec: 312, durationSec: 888, updatedAt: 3 },
  { titleId: 'codigo-andino', positionSec: 150, durationSec: 372, updatedAt: 2 },
  { titleId: 'tears-of-steel', positionSec: 95, durationSec: 734, updatedAt: 1 },
];

let memoryFallback: Record<string, WatchProgress> | null = null;

function read(): Record<string, WatchProgress> {
  if (memoryFallback) return memoryFallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, WatchProgress>;
  } catch {
    // Corrupted JSON or storage disabled: fall through to the seed.
  }
  return Object.fromEntries(SEED.map((p) => [p.titleId, p]));
}

function write(data: Record<string, WatchProgress>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    memoryFallback = null;
  } catch {
    memoryFallback = data;
  }
}

/** Most recently watched first. */
export function listProgress(): WatchProgress[] {
  return Object.values(read()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProgress(titleId: string): WatchProgress | undefined {
  return read()[titleId];
}

export function saveProgress(titleId: string, positionSec: number, durationSec: number): void {
  if (!Number.isFinite(positionSec) || !Number.isFinite(durationSec) || durationSec <= 0) return;
  const data = { ...read() };
  if (positionSec < MIN_POSITION_SEC || positionSec / durationSec >= END_THRESHOLD) {
    delete data[titleId];
  } else {
    data[titleId] = { titleId, positionSec, durationSec, updatedAt: Date.now() };
  }
  write(data);
}

export function progressRatio(p: WatchProgress): number {
  return Math.min(1, Math.max(0, p.positionSec / p.durationSec));
}
