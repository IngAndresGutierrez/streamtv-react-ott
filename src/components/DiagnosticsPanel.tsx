import type { Diagnostics } from '../player/useDiagnostics';
import { NA, formatBitrate, formatCount, formatMs, formatResolution } from '../player/format';
import type { StreamSource } from '../types/catalog';
import type { PlaybackStatus } from '../player/usePlayer';
import { STATUS_LABEL } from '../player/status';

interface DiagnosticsPanelProps {
  data: Diagnostics | null;
  stream: StreamSource;
  status: PlaybackStatus;
}

function Row({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="diag__row">
      <dt>{label}</dt>
      <dd data-testid={testId} className={value === NA ? 'diag__na' : undefined}>
        {value}
      </dd>
    </div>
  );
}

export function DiagnosticsPanel({ data, stream, status }: DiagnosticsPanelProps) {
  const qoe = data?.qoe;
  const engine = data?.engine;
  const frames = qoe?.frames;
  const lastError = qoe?.errors.at(-1);

  return (
    <aside className="diag" aria-label="Panel de diagnóstico" data-testid="diagnostics-panel">
      <h2 className="diag__title">Diagnóstico QoE</h2>
      <dl>
        <Row label="Estado" value={STATUS_LABEL[status]} testId="diag-status" />
        <Row label="Formato" value={stream.format.toUpperCase()} />
        <Row label="Inicio de reproducción" value={formatMs(qoe?.startupTimeMs)} testId="diag-startup" />
        <Row label="Eventos de rebuffering" value={formatCount(qoe?.rebufferCount)} testId="diag-rebuffer-count" />
        <Row label="Tiempo en rebuffering" value={formatMs(qoe ? qoe.rebufferDurationMs : null)} />
        <Row label="Errores" value={formatCount(qoe?.errors.length)} testId="diag-errors" />
        <Row label="Último error" value={lastError ? lastError.code : NA} />
        <Row
          label="Frames perdidos"
          value={frames ? `${frames.dropped} / ${frames.total}` : NA}
          testId="diag-dropped"
        />
        <Row label="Resolución" value={formatResolution(engine?.width, engine?.height)} />
        <Row label="Bitrate de la variante" value={formatBitrate(engine?.streamBandwidth)} />
        <Row label="Ancho de banda estimado" value={formatBitrate(engine?.estimatedBandwidth)} />
        <Row label="Buffer adelantado" value={data?.bufferAheadSec != null ? `${data.bufferAheadSec.toFixed(1)} s` : NA} />
        <Row label="Códecs" value={engine?.currentCodecs || NA} />
        <Row label="Shaka Player" value={data?.engineVersion ?? NA} />
        <Row label="DRM" value="No implementado" />
      </dl>
      <p className="diag__hint">
        <kbd>D</kbd> ocultar · N/A = el navegador o el stream no expone la métrica
      </p>
    </aside>
  );
}
