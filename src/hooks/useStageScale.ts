import { useEffect, useState } from 'react';

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

function computeScale(width: number, height: number, padding: number): number {
  const availableW = Math.max(1, window.innerWidth - padding * 2);
  const availableH = Math.max(1, window.innerHeight - padding * 2);
  return Math.min(availableW / width, availableH / height);
}

/**
 * Scale factor that fits a fixed-size design (e.g. the 1920×1080 TV canvas,
 * or the whole TV + remote scene) inside the viewport, preserving its ratio.
 */
export function useFitScale(width: number, height: number, padding = 0): number {
  const [scale, setScale] = useState(() => computeScale(width, height, padding));
  useEffect(() => {
    const onResize = () => setScale(computeScale(width, height, padding));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [width, height, padding]);
  return scale;
}
