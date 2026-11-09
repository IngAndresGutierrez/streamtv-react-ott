import type { Title } from '../types/catalog';
import type { FocusableProps } from '../navigation/useGridNavigation';

interface TitleCardProps {
  title: Title;
  focusProps: FocusableProps;
  /** 0..1, renders a progress bar for "continue watching". */
  progress?: number;
}

export function TitleCard({ title, focusProps, progress }: TitleCardProps) {
  const label =
    progress === undefined ? title.title : `${title.title}, ${Math.round(progress * 100)}% visto`;
  return (
    <button type="button" className="card" aria-label={label} data-testid={`card-${title.id}`} {...focusProps}>
      <img className="card__poster" src={title.poster} alt="" loading="lazy" decoding="async" />
      {progress !== undefined && (
        <span className="card__progress" aria-hidden="true">
          <span className="card__progress-fill" style={{ width: `${progress * 100}%` }} />
        </span>
      )}
    </button>
  );
}
