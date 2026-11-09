import type { ReactNode } from 'react';
import { STAGE_HEIGHT, STAGE_WIDTH, useFitScale } from '../hooks/useStageScale';
import { RemoteControl } from './RemoteControl';

/** Design size of the "living room" scene: TV (bezel + stand) and remote. */
const BEZEL = 26;
const CHIN = 46;
const STAND = 96;
const REMOTE_GAP = 110;
const REMOTE_WIDTH = 230;
const TV_WIDTH = STAGE_WIDTH + BEZEL * 2;
const SCENE_WIDTH = TV_WIDTH + REMOTE_GAP + REMOTE_WIDTH;
const SCENE_HEIGHT = STAGE_HEIGHT + BEZEL + CHIN + STAND;
const SCENE_PADDING = 24;

/** `?tv=0` shows only the 16:9 canvas (kiosk mode / a real TV browser). */
function isTvFrameEnabled(): boolean {
  return new URLSearchParams(window.location.search).get('tv') !== '0';
}

const FRAMED = isTvFrameEnabled();

/**
 * Fixed 1920×1080 canvas, like a TV panel. By default it is rendered inside a
 * TV mock-up with an on-screen remote; the app inside is identical either way.
 */
export function Stage({ children }: { children: ReactNode }) {
  const scale = useFitScale(
    FRAMED ? SCENE_WIDTH : STAGE_WIDTH,
    FRAMED ? SCENE_HEIGHT : STAGE_HEIGHT,
    FRAMED ? SCENE_PADDING : 0,
  );

  const stage = (
    <div className="stage" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}>
      {children}
    </div>
  );

  if (!FRAMED) {
    return (
      <div className="stage-viewport">
        <div className="stage-fit" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
          {stage}
        </div>
      </div>
    );
  }

  return (
    <div className="room">
      <div
        className="scene"
        style={{ width: SCENE_WIDTH, height: SCENE_HEIGHT, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="tv" style={{ width: TV_WIDTH }}>
          <div className="tv__panel" style={{ padding: `${BEZEL}px ${BEZEL}px ${CHIN}px` }}>
            {stage}
            <span className="tv__logo" aria-hidden="true">
              STREAM<b>TV</b>
            </span>
            <span className="tv__led" aria-hidden="true" />
          </div>
          <div className="tv__stand" aria-hidden="true" style={{ height: STAND }}>
            <span className="tv__neck" />
            <span className="tv__base" />
          </div>
        </div>
        <div className="scene__remote" style={{ width: REMOTE_WIDTH, marginLeft: REMOTE_GAP }}>
          <RemoteControl />
        </div>
      </div>
    </div>
  );
}
