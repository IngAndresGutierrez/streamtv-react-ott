import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTitle } from '../data/catalog';
import type { EngineCallbacks, PlaybackEngine } from '../player/shakaEngine';
import { PlayerPage } from './PlayerPage';

const title = getTitle('sintel')!;
const press = (key: string, code = '') => fireEvent.keyDown(window, { key, code });

interface FakeEngine extends PlaybackEngine {
  callbacks: EngineCallbacks;
  load: ReturnType<typeof vi.fn<PlaybackEngine['load']>>;
  destroy: ReturnType<typeof vi.fn<PlaybackEngine['destroy']>>;
}

function fakeEngineFactory(loadImpl: (engine: FakeEngine) => Promise<void>) {
  const engines: FakeEngine[] = [];
  const create = vi.fn<(video: HTMLVideoElement, callbacks: EngineCallbacks) => Promise<PlaybackEngine>>(async (_video, callbacks) => {
    const engine = {
      version: 'fake',
      callbacks,
      getStats: () => ({
        width: Number.NaN,
        height: Number.NaN,
        streamBandwidth: Number.NaN,
        estimatedBandwidth: Number.NaN,
        droppedFrames: Number.NaN,
        decodedFrames: Number.NaN,
        currentCodecs: '',
      }),
      destroy: vi.fn<() => Promise<void>>(async () => {}),
    } as unknown as FakeEngine;
    engine.load = vi.fn<PlaybackEngine['load']>(() => loadImpl(engine));
    engines.push(engine);
    return engine;
  });
  return { create, engines };
}

const flush = () => act(async () => {});

beforeEach(() => {
  // jsdom does not implement media playback.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

describe('PlayerPage', () => {
  it('shows a loading state and focuses Play/Pause', async () => {
    const { create } = fakeEngineFactory(() => new Promise(() => {}));
    render(<PlayerPage title={title} onBack={() => {}} createEngine={create} />);
    await flush();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    expect(document.activeElement).toBe(screen.getByTestId('control-play-pause'));
  });

  it('shows an accessible error with retry focused, and retry reloads the stream', async () => {
    const { create, engines } = fakeEngineFactory(async (engine) => {
      engine.callbacks.onError({ code: '1001 BAD_HTTP_STATUS', category: 'NETWORK', message: 'Sin red', fatal: true });
      throw Object.assign(new Error('load failed'), { code: 1001, category: 1 });
    });
    render(<PlayerPage title={title} onBack={() => {}} createEngine={create} />);
    await flush();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Sin red');
    expect(alert).toHaveTextContent('NETWORK · 1001 BAD_HTTP_STATUS');
    expect(document.activeElement).toBe(screen.getByTestId('player-retry'));

    press('Enter');
    await flush();
    expect(create).toHaveBeenCalledTimes(2);
    expect(engines[0].destroy).toHaveBeenCalled();
  });

  it('retry waits for the previous engine to release the <video> before attaching a new one', async () => {
    let releasePrevious!: () => void;
    const { create, engines } = fakeEngineFactory(async (engine) => {
      engine.callbacks.onError({ code: 'X', category: 'NETWORK', message: 'm', fatal: true });
      throw Object.assign(new Error('x'), { code: 1001, category: 1 });
    });
    render(<PlayerPage title={title} onBack={() => {}} createEngine={create} />);
    await flush();
    engines[0].destroy.mockImplementation(() => new Promise<void>((resolve) => (releasePrevious = resolve)));

    press('Enter'); // retry
    await flush();
    expect(engines[0].destroy).toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1); // still detaching

    await act(async () => releasePrevious());
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('back from the error dialog leaves the player', async () => {
    const onBack = vi.fn<() => void>();
    const { create } = fakeEngineFactory(async (engine) => {
      engine.callbacks.onError({ code: 'X', category: 'MANIFEST', message: 'm', fatal: true });
      throw Object.assign(new Error('x'), { code: 4000, category: 4 });
    });
    render(<PlayerPage title={title} onBack={onBack} createEngine={create} />);
    await flush();
    press('ArrowRight');
    press('Enter');
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('toggles the diagnostics panel with D and shows N/A for unavailable metrics', async () => {
    const { create } = fakeEngineFactory(async () => {});
    render(<PlayerPage title={title} onBack={() => {}} createEngine={create} />);
    await flush();

    press('d', 'KeyD');
    const panel = await screen.findByTestId('diagnostics-panel');
    expect(panel).toBeInTheDocument();
    // No "playing" event in jsdom → startup was never observed.
    expect(screen.getByTestId('diag-startup')).toHaveTextContent('N/A');
    expect(screen.getByTestId('diag-dropped')).toHaveTextContent('N/A');

    press('d', 'KeyD');
    expect(screen.queryByTestId('diagnostics-panel')).not.toBeInTheDocument();
  });

  it('releases the player engine on unmount', async () => {
    const { create, engines } = fakeEngineFactory(async () => {});
    const { unmount } = render(<PlayerPage title={title} onBack={() => {}} createEngine={create} />);
    await flush();
    unmount();
    expect(engines.at(-1)!.destroy).toHaveBeenCalledTimes(1);
  });

  it('calls onBack with Escape', async () => {
    const onBack = vi.fn<() => void>();
    const { create } = fakeEngineFactory(() => new Promise(() => {}));
    render(<PlayerPage title={title} onBack={onBack} createEngine={create} />);
    press('Escape');
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
