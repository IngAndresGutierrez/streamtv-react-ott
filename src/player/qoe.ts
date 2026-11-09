/**
 * Quality-of-Experience tracker. Pure and clock-injectable so it can be unit
 * tested without a browser. Every metric is `null` until it has really been
 * observed; the UI renders `null` as "N/A" (values are never estimated).
 *
 * Definitions:
 * - startupTimeMs: from `loadStarted()` (load requested) to the first `playing`.
 * - rebuffering: buffering that happens AFTER the first frame. The initial
 *   buffering is already captured by the startup time.
 */
export interface QoeError {
  at: number;
  code: string;
  message: string;
  fatal: boolean;
}

export interface FrameStats {
  dropped: number;
  total: number;
}

export interface QoeSnapshot {
  startupTimeMs: number | null;
  rebufferCount: number;
  rebufferDurationMs: number;
  isRebuffering: boolean;
  errors: readonly QoeError[];
  frames: FrameStats | null;
}

export class QoeTracker {
  private loadStartedAt: number | null = null;
  private startupTimeMs: number | null = null;
  private rebufferCount = 0;
  private rebufferAccumulatedMs = 0;
  private rebufferStartedAt: number | null = null;
  private errors: QoeError[] = [];
  private frames: FrameStats | null = null;

  private readonly now: () => number;

  constructor(now: () => number = () => performance.now()) {
    this.now = now;
  }

  /** A (re)load was requested. Restarts the startup measurement only. */
  loadStarted(): void {
    this.loadStartedAt = this.now();
    this.startupTimeMs = null;
    this.endRebuffer();
  }

  /** First `playing` event after a load. Subsequent calls are ignored. */
  firstFrame(): void {
    if (this.startupTimeMs !== null || this.loadStartedAt === null) return;
    this.startupTimeMs = this.now() - this.loadStartedAt;
  }

  bufferingChanged(isBuffering: boolean): void {
    if (this.startupTimeMs === null) return; // still starting up
    if (isBuffering && this.rebufferStartedAt === null) {
      this.rebufferStartedAt = this.now();
      this.rebufferCount += 1;
    } else if (!isBuffering) {
      this.endRebuffer();
    }
  }

  error(code: string, message: string, fatal: boolean): void {
    this.errors = [...this.errors, { at: this.now(), code, message, fatal }];
    this.endRebuffer();
  }

  /** Pass `null` when the platform cannot report frame statistics. */
  setFrames(frames: FrameStats | null): void {
    this.frames = frames;
  }

  snapshot(): QoeSnapshot {
    const ongoing = this.rebufferStartedAt === null ? 0 : this.now() - this.rebufferStartedAt;
    return {
      startupTimeMs: this.startupTimeMs,
      rebufferCount: this.rebufferCount,
      rebufferDurationMs: this.rebufferAccumulatedMs + ongoing,
      isRebuffering: this.rebufferStartedAt !== null,
      errors: this.errors,
      frames: this.frames,
    };
  }

  private endRebuffer(): void {
    if (this.rebufferStartedAt === null) return;
    this.rebufferAccumulatedMs += this.now() - this.rebufferStartedAt;
    this.rebufferStartedAt = null;
  }
}

/**
 * Reads dropped/total frames from the standard Media Playback Quality API.
 * Returns null when unsupported (some TV engines and older WebKit builds).
 */
export function readFrameStats(video: HTMLVideoElement): FrameStats | null {
  if (typeof video.getVideoPlaybackQuality !== 'function') return null;
  const q = video.getVideoPlaybackQuality();
  if (!Number.isFinite(q.droppedVideoFrames) || !Number.isFinite(q.totalVideoFrames)) return null;
  return { dropped: q.droppedVideoFrames, total: q.totalVideoFrames };
}
