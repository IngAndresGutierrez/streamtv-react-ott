import type { ReactNode } from 'react';
import { STAGE_HEIGHT, STAGE_WIDTH, useStageScale } from '../hooks/useStageScale';

/** Fixed 1920×1080 canvas scaled to the viewport, like a TV panel. */
export function Stage({ children }: { children: ReactNode }) {
  const scale = useStageScale();
  return (
    <div className="stage-viewport">
      <div
        className="stage"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
