import { useCallback, useMemo, useRef } from 'react';
import { Hero } from '../components/Hero';
import { KeyHints } from '../components/KeyHints';
import { Rail } from '../components/Rail';
import { FEATURED_ID, STATIC_RAILS, getTitle } from '../data/catalog';
import { listProgress, progressRatio } from '../data/watchProgress';
import { useGridNavigation } from '../navigation/useGridNavigation';
import type { Rail as RailData, Title } from '../types/catalog';
import type { GridPosition } from '../types/navigation';

interface HomePageProps {
  onOpenDetail: (titleId: string) => void;
  onPlay: (titleId: string) => void;
}

const HERO_ROW = 0;

function buildContinueRail(): { rail: RailData; ratios: Map<string, number> } {
  const ratios = new Map<string, number>();
  const items: Title[] = [];
  for (const p of listProgress()) {
    const title = getTitle(p.titleId);
    if (!title) continue;
    items.push(title);
    ratios.set(title.id, progressRatio(p));
  }
  return { rail: { id: 'continue', title: 'Continuar viendo', items }, ratios };
}

export function HomePage({ onOpenDetail, onPlay }: HomePageProps) {
  const featured = getTitle(FEATURED_ID)!;
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Read once per mount: returning from the player remounts Home with fresh progress.
  const { rails, ratios } = useMemo(() => {
    const { rail, ratios } = buildContinueRail();
    return { rails: rail.items.length > 0 ? [rail, ...STATIC_RAILS] : STATIC_RAILS, ratios };
  }, []);

  // Row 0 = hero buttons, rows 1..n = rails.
  const rows = useMemo(() => [2, ...rails.map((r) => r.items.length)], [rails]);

  const handleSelect = useCallback(
    ({ row, col }: GridPosition) => {
      if (row === HERO_ROW) {
        if (col === 0) onPlay(featured.id);
        else onOpenDetail(featured.id);
        return;
      }
      const title = rails[row - 1]?.items[col];
      if (title) onOpenDetail(title.id);
    },
    [rails, featured.id, onOpenDetail, onPlay],
  );

  const scrollIntoView = useCallback((element: HTMLElement, { row }: GridPosition) => {
    const scroller = scrollerRef.current;
    const behavior: ScrollBehavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (!scroller || typeof scroller.scrollTo !== 'function') return;
    if (row === HERO_ROW) {
      scroller.scrollTo({ top: 0, behavior });
      return;
    }
    // Vertical: keep the focused rail at a fixed "reading line".
    const section = element.closest('section');
    if (section) scroller.scrollTo({ top: Math.max(0, section.offsetTop - 340), behavior });
    // Horizontal: keep the focused card aligned to the left safe area.
    const track = element.closest<HTMLElement>('.rail__track');
    const item = element.parentElement;
    const first = track?.firstElementChild as HTMLElement | null;
    if (track && item && first && typeof track.scrollTo === 'function') {
      // Distance from the first card, so the focused card sits where the first one starts.
      track.scrollTo({ left: Math.max(0, item.offsetLeft - first.offsetLeft), behavior });
    }
  }, []);

  const { getItemProps } = useGridNavigation({
    rows,
    screenKey: 'home',
    initialFocus: { row: HERO_ROW, col: 0 },
    onSelect: handleSelect,
    scrollIntoView,
  });

  return (
    <main className="home" data-testid="home-page">
      <div className="brand" aria-hidden="true">
        Stream<span>TV</span>
      </div>
      <div className="home__scroller" ref={scrollerRef}>
        <Hero title={featured} playProps={getItemProps(HERO_ROW, 0)} infoProps={getItemProps(HERO_ROW, 1)} />
        <div className="rails">
          {rails.map((rail, index) => (
            <Rail
              key={rail.id}
              id={rail.id}
              heading={rail.title}
              items={rail.items}
              getItemProps={(col) => getItemProps(index + 1, col)}
              getProgress={rail.id === 'continue' ? (t) => ratios.get(t.id) : undefined}
            />
          ))}
        </div>
      </div>
      <KeyHints
        hints={[
          { keys: '← ↑ → ↓', label: 'Navegar' },
          { keys: 'Enter', label: 'Seleccionar' },
          { keys: 'Esc / ⌫', label: 'Volver' },
        ]}
      />
    </main>
  );
}
