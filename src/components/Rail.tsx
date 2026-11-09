import type { Title } from '../types/catalog';
import type { FocusableProps } from '../navigation/useGridNavigation';
import { TitleCard } from './TitleCard';

interface RailProps {
  id: string;
  heading: string;
  items: Title[];
  getItemProps: (col: number) => FocusableProps;
  getProgress?: (title: Title) => number | undefined;
}

export function Rail({ id, heading, items, getItemProps, getProgress }: RailProps) {
  const headingId = `rail-${id}`;
  return (
    <section className="rail" aria-labelledby={headingId} data-testid={headingId}>
      <h2 id={headingId} className="rail__heading">
        {heading}
      </h2>
      <ul className="rail__track">
        {items.map((title, col) => (
          <li key={title.id} className="rail__item">
            <TitleCard title={title} focusProps={getItemProps(col)} progress={getProgress?.(title)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
