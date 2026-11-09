import { describe, expect, it } from 'vitest';
import { QoeTracker, readFrameStats } from './qoe';

function setup() {
  let now = 0;
  const tracker = new QoeTracker(() => now);
  return { tracker, advance: (ms: number) => (now += ms) };
}

describe('QoeTracker', () => {
  it('reports nothing measured before playback (null, not zero)', () => {
    const { tracker } = setup();
    const s = tracker.snapshot();
    expect(s.startupTimeMs).toBeNull();
    expect(s.frames).toBeNull();
    expect(s.rebufferCount).toBe(0);
  });

  it('measures startup time from load request to first frame', () => {
    const { tracker, advance } = setup();
    tracker.loadStarted();
    advance(1250);
    tracker.firstFrame();
    advance(5000);
    tracker.firstFrame(); // later "playing" events (after pause/seek) are ignored
    expect(tracker.snapshot().startupTimeMs).toBe(1250);
  });

  it('does not count the initial buffering as rebuffering', () => {
    const { tracker, advance } = setup();
    tracker.loadStarted();
    tracker.bufferingChanged(true);
    advance(800);
    tracker.bufferingChanged(false);
    tracker.firstFrame();
    expect(tracker.snapshot().rebufferCount).toBe(0);
    expect(tracker.snapshot().rebufferDurationMs).toBe(0);
  });

  it('counts rebuffer events and accumulates their duration, including an ongoing one', () => {
    const { tracker, advance } = setup();
    tracker.loadStarted();
    tracker.firstFrame();

    tracker.bufferingChanged(true);
    advance(300);
    tracker.bufferingChanged(true); // duplicate "start" is ignored
    advance(200);
    tracker.bufferingChanged(false);

    tracker.bufferingChanged(true);
    advance(100);

    const s = tracker.snapshot();
    expect(s.rebufferCount).toBe(2);
    expect(s.rebufferDurationMs).toBe(600);
    expect(s.isRebuffering).toBe(true);
  });

  it('records errors and closes an open rebuffer', () => {
    const { tracker, advance } = setup();
    tracker.loadStarted();
    tracker.firstFrame();
    tracker.bufferingChanged(true);
    advance(400);
    tracker.error('1001 BAD_HTTP_STATUS', 'network', true);
    advance(1000);
    const s = tracker.snapshot();
    expect(s.errors).toHaveLength(1);
    expect(s.errors[0]).toMatchObject({ code: '1001 BAD_HTTP_STATUS', fatal: true });
    expect(s.isRebuffering).toBe(false);
    expect(s.rebufferDurationMs).toBe(400);
  });

  it('restarts only the startup measurement on retry', () => {
    const { tracker, advance } = setup();
    tracker.loadStarted();
    tracker.error('X', 'boom', true);
    tracker.loadStarted();
    advance(900);
    tracker.firstFrame();
    const s = tracker.snapshot();
    expect(s.startupTimeMs).toBe(900);
    expect(s.errors).toHaveLength(1);
  });
});

describe('readFrameStats', () => {
  it('returns null when the browser does not expose getVideoPlaybackQuality', () => {
    const video = {} as HTMLVideoElement;
    expect(readFrameStats(video)).toBeNull();
  });

  it('reads dropped and total frames when available', () => {
    const video = {
      getVideoPlaybackQuality: () => ({ droppedVideoFrames: 3, totalVideoFrames: 120 }),
    } as unknown as HTMLVideoElement;
    expect(readFrameStats(video)).toEqual({ dropped: 3, total: 120 });
  });
});
