import { useCallback } from 'react';
import { Stage } from './components/Stage';
import { getTitle } from './data/catalog';
import { getProgress } from './data/watchProgress';
import { useScreenStack } from './hooks/useScreenStack';
import { DetailPage } from './pages/DetailPage';
import { HomePage } from './pages/HomePage';
import { PlayerPage } from './pages/PlayerPage';

export function App() {
  const { current, push, back } = useScreenStack();

  const openDetail = useCallback((titleId: string) => push({ name: 'detail', titleId }), [push]);
  const play = useCallback(
    (titleId: string, fromStart = false) => {
      const startTime = fromStart ? undefined : getProgress(titleId)?.positionSec;
      push({ name: 'player', titleId, startTime });
    },
    [push],
  );

  const title = current.name === 'home' ? undefined : getTitle(current.titleId);

  return (
    <Stage>
      {current.name === 'home' && <HomePage onOpenDetail={openDetail} onPlay={(id) => play(id)} />}
      {current.name === 'detail' && title && <DetailPage key={title.id} title={title} onPlay={play} onBack={back} />}
      {current.name === 'player' && title && (
        <PlayerPage key={title.id} title={title} startTime={current.startTime} onBack={back} />
      )}
    </Stage>
  );
}
