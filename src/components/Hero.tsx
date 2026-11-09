import type { Title } from '../types/catalog';
import type { FocusableProps } from '../navigation/useGridNavigation';
import { TitleMeta } from './TitleMeta';

interface HeroProps {
  title: Title;
  playProps: FocusableProps;
  infoProps: FocusableProps;
}

export function Hero({ title, playProps, infoProps }: HeroProps) {
  return (
    <header className="hero" aria-label="Destacado">
      <img className="hero__backdrop" src={title.backdrop} alt="" />
      <div className="hero__shade" />
      <div className="hero__content">
        <p className="eyebrow">Destacado</p>
        <h1 className="hero__title">{title.title}</h1>
        <TitleMeta title={title} />
        <p className="hero__synopsis">{title.synopsis}</p>
        <div className="actions">
          <button type="button" className="btn btn--primary" data-testid="hero-play" {...playProps}>
            ▶ Reproducir
          </button>
          <button type="button" className="btn" data-testid="hero-info" {...infoProps}>
            Más información
          </button>
        </div>
      </div>
    </header>
  );
}
