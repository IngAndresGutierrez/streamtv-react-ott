import { useCallback, useMemo } from 'react';
import { KeyHints } from '../components/KeyHints';
import { TitleMeta } from '../components/TitleMeta';
import { getProgress } from '../data/watchProgress';
import { useGridNavigation } from '../navigation/useGridNavigation';
import type { Title } from '../types/catalog';
import type { GridPosition } from '../types/navigation';
import { formatClock } from '../player/format';

interface DetailPageProps {
  title: Title;
  onPlay: (titleId: string, fromStart: boolean) => void;
  onBack: () => void;
}

interface Action {
  id: string;
  label: string;
  run: () => void;
  primary?: boolean;
}

export function DetailPage({ title, onPlay, onBack }: DetailPageProps) {
  const progress = useMemo(() => getProgress(title.id), [title.id]);

  const actions = useMemo<Action[]>(() => {
    const list: Action[] = [];
    if (progress) {
      list.push({ id: 'resume', label: `▶ Reanudar ${formatClock(progress.positionSec)}`, run: () => onPlay(title.id, false), primary: true });
      list.push({ id: 'restart', label: '↺ Desde el inicio', run: () => onPlay(title.id, true) });
    } else {
      list.push({ id: 'play', label: '▶ Reproducir', run: () => onPlay(title.id, true), primary: true });
    }
    list.push({ id: 'back', label: 'Volver', run: onBack });
    return list;
  }, [progress, title.id, onPlay, onBack]);

  const handleSelect = useCallback(({ col }: GridPosition) => actions[col]?.run(), [actions]);

  const { getItemProps } = useGridNavigation({
    rows: [actions.length],
    screenKey: `detail:${title.id}`,
    onSelect: handleSelect,
    onBack,
    scrollIntoView: () => {},
  });

  return (
    <main className="detail" data-testid="detail-page">
      <img className="detail__backdrop" src={title.backdrop} alt="" />
      <div className="detail__shade" />
      <div className="detail__content">
        <img className="detail__poster" src={title.poster} alt={`Póster de ${title.title}`} />
        <div className="detail__info">
          <h1 className="detail__title">{title.title}</h1>
          <TitleMeta title={title} />
          <p className="detail__synopsis">{title.synopsis}</p>
          <div className="actions">
            {actions.map((action, col) => (
              <button
                key={action.id}
                type="button"
                className={action.primary ? 'btn btn--primary' : 'btn'}
                data-testid={`detail-${action.id}`}
                {...getItemProps(0, col)}
              >
                {action.label}
              </button>
            ))}
          </div>
          <dl className="detail__facts">
            <div>
              <dt>Stream</dt>
              <dd>
                {title.stream.format.toUpperCase()} · {title.stream.provider}
              </dd>
            </div>
            <div>
              <dt>Protección</dt>
              <dd>Sin DRM (contenido de prueba en claro)</dd>
            </div>
            {title.credit && (
              <div>
                <dt>Créditos</dt>
                <dd>{title.credit}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      <KeyHints
        hints={[
          { keys: '← →', label: 'Navegar' },
          { keys: 'Enter', label: 'Seleccionar' },
          { keys: 'Esc / ⌫', label: 'Volver al catálogo' },
        ]}
      />
    </main>
  );
}
