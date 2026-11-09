import type { Title } from '../types/catalog';

export function TitleMeta({ title }: { title: Title }) {
  return (
    <p className="meta">
      <span>{title.year}</span>
      <span className="meta__badge">
        <span className="visually-hidden">Clasificación </span>
        {title.maturity}
      </span>
      <span>{title.durationLabel}</span>
      <span>{title.genres.join(' · ')}</span>
      <span className="meta__badge">{title.stream.format.toUpperCase()}</span>
    </p>
  );
}
