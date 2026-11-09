/**
 * Thin adapter over Shaka Player. The rest of the app depends on the small
 * `PlaybackEngine` interface, never on Shaka types (easy to mock in tests and
 * to swap for a native AVPlay/webOS pipeline later).
 *
 * Shaka is loaded with a dynamic import so it is not part of the Home bundle:
 * TV browsers pay a real cost for parsing JavaScript at startup.
 */
export interface EngineError {
  code: string;
  category: string;
  message: string;
  fatal: boolean;
}

export interface EngineStats {
  width: number;
  height: number;
  streamBandwidth: number;
  estimatedBandwidth: number;
  droppedFrames: number;
  decodedFrames: number;
  currentCodecs: string;
}

export interface EngineCallbacks {
  onError: (error: EngineError) => void;
  onBuffering: (isBuffering: boolean) => void;
}

export interface PlaybackEngine {
  readonly version: string;
  load(url: string, startTime?: number): Promise<void>;
  getStats(): EngineStats;
  destroy(): Promise<void>;
}

type ShakaModule = typeof import('shaka-player').default;

let shakaPromise: Promise<ShakaModule> | null = null;

function loadShaka(): Promise<ShakaModule> {
  shakaPromise ??= import('shaka-player').then(({ default: shaka }) => {
    shaka.polyfill.installAll();
    return shaka;
  });
  return shakaPromise;
}

/** Shaka error code raised when a load is interrupted by unload/destroy. */
const LOAD_INTERRUPTED = 7000;
const SEVERITY_CRITICAL = 2;

const FRIENDLY_BY_CATEGORY: Record<string, string> = {
  NETWORK: 'No se pudo descargar el contenido. Revisa la conexión de red.',
  MANIFEST: 'El manifiesto del stream no está disponible o es inválido.',
  MEDIA: 'El dispositivo no pudo decodificar este contenido.',
  STREAMING: 'Se interrumpió la transmisión del contenido.',
  DRM: 'El contenido requiere DRM, que no está soportado en esta demo.',
};

function enumName(enumObject: Record<string, unknown>, value: unknown): string {
  return Object.keys(enumObject).find((key) => enumObject[key] === value) ?? String(value);
}

export function isLoadInterrupted(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === LOAD_INTERRUPTED;
}

function toEngineError(shaka: ShakaModule, raw: unknown, fatalByDefault: boolean): EngineError {
  if (raw && typeof raw === 'object' && 'code' in raw && 'category' in raw) {
    const err = raw as { code: number; category: number; severity?: number };
    const category = enumName(shaka.util.Error.Category as unknown as Record<string, unknown>, err.category);
    const codeName = enumName(shaka.util.Error.Code as unknown as Record<string, unknown>, err.code);
    return {
      code: `${err.code} ${codeName}`,
      category,
      message: FRIENDLY_BY_CATEGORY[category] ?? 'Ocurrió un error en el reproductor.',
      fatal: err.severity === undefined ? fatalByDefault : err.severity === SEVERITY_CRITICAL,
    };
  }
  return {
    code: 'UNKNOWN',
    category: 'PLAYER',
    message: raw instanceof Error ? raw.message : 'Ocurrió un error en el reproductor.',
    fatal: fatalByDefault,
  };
}

export class UnsupportedPlatformError extends Error {
  constructor() {
    super('Este navegador no soporta Media Source Extensions (MSE).');
    this.name = 'UnsupportedPlatformError';
  }
}

export async function createShakaEngine(video: HTMLVideoElement, callbacks: EngineCallbacks): Promise<PlaybackEngine> {
  const shaka = await loadShaka();
  if (!shaka.Player.isBrowserSupported()) throw new UnsupportedPlatformError();

  const player = new shaka.Player();
  await player.attach(video);
  player.configure({
    streaming: {
      // Conservative values suited to memory-constrained TV devices.
      bufferingGoal: 30,
      rebufferingGoal: 2,
      bufferBehind: 30,
      retryParameters: { maxAttempts: 3, baseDelay: 500, backoffFactor: 2, timeout: 15000 },
    },
    manifest: { retryParameters: { maxAttempts: 2, baseDelay: 500, backoffFactor: 2, timeout: 10000 } },
  });

  // Shaka may both reject load() and dispatch "error" with the same object.
  const reported = new WeakSet<object>();
  const report = (raw: unknown, fatalByDefault: boolean) => {
    if (isLoadInterrupted(raw)) return;
    if (raw && typeof raw === 'object') {
      if (reported.has(raw)) return;
      reported.add(raw);
    }
    callbacks.onError(toEngineError(shaka, raw, fatalByDefault));
  };

  const onError = (event: Event) => report((event as Event & { detail?: unknown }).detail, false);
  const onBuffering = (event: Event) => callbacks.onBuffering(Boolean((event as Event & { buffering?: boolean }).buffering));
  player.addEventListener('error', onError);
  player.addEventListener('buffering', onBuffering);

  let destroyed = false;

  return {
    version: shaka.Player.version,
    async load(url, startTime) {
      try {
        await player.load(url, startTime ?? null);
      } catch (error) {
        if (destroyed || isLoadInterrupted(error)) throw error;
        report(error, true);
        throw error;
      }
    },
    getStats() {
      const s = player.getStats();
      return {
        width: s.width,
        height: s.height,
        streamBandwidth: s.streamBandwidth,
        estimatedBandwidth: s.estimatedBandwidth,
        droppedFrames: s.droppedFrames,
        decodedFrames: s.decodedFrames,
        currentCodecs: s.currentCodecs,
      };
    },
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      player.removeEventListener('error', onError);
      player.removeEventListener('buffering', onBuffering);
      // Detaches from the <video>, aborts requests and releases MediaSource buffers.
      await player.destroy();
    },
  };
}
