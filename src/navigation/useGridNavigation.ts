import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridPosition, RemoteAction } from '../types/navigation';
import { clampPosition, moveFocus, samePosition, type ColumnMemory } from './focusGrid';
import { restoreFocus, saveFocus } from './focusMemory';
import { useRemoteKeys } from './useRemoteKeys';

export interface GridNavigationOptions {
  /** Items per row. */
  rows: readonly number[];
  /** When set, the position is persisted and restored on remount. */
  screenKey?: string;
  initialFocus?: GridPosition;
  /** Changing this value moves focus back to `initialFocus` (e.g. a dialog replaced the controls). */
  resetKey?: string | number;
  onSelect?: (pos: GridPosition) => void;
  onBack?: () => void;
  /** Any other action (media keys, diagnostics). Return true when handled. */
  onAction?: (action: RemoteAction, pos: GridPosition) => boolean | void;
  /** Called after every D-pad key, before focus moves. Return true to swallow the key. */
  onBeforeKey?: (action: RemoteAction) => boolean;
  /** Custom scrolling, e.g. keep the hero visible. Defaults to scrollIntoView. */
  scrollIntoView?: (element: HTMLElement, pos: GridPosition) => void;
  enabled?: boolean;
}

export interface FocusableProps {
  ref: (element: HTMLElement | null) => void;
  tabIndex: number;
  'data-focused': boolean;
  onClick: () => void;
  onFocus: () => void;
}

const ORIGIN: GridPosition = { row: 0, col: 0 };
const keyOf = (row: number, col: number) => `${row}:${col}`;

function defaultScroll(element: HTMLElement): void {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
}

/**
 * Roving-focus controller for a grid of rows. It owns *which* item is focused
 * and keeps the real DOM focus in sync (for accessibility and :focus-visible);
 * components only spread `getItemProps(row, col)` on their focusable element.
 */
export function useGridNavigation({
  rows,
  screenKey,
  initialFocus = ORIGIN,
  resetKey,
  onSelect,
  onBack,
  onAction,
  onBeforeKey,
  scrollIntoView = defaultScroll,
  enabled = true,
}: GridNavigationOptions) {
  const rowsKey = rows.join(',');
  // Re-create only when the shape changes, not on every parent render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableRows = useMemo(() => rows, [rowsKey]);

  const [focus, setFocus] = useState<GridPosition>(() => {
    const saved = screenKey ? restoreFocus(screenKey) : undefined;
    return clampPosition(rows, saved ?? initialFocus) ?? ORIGIN;
  });
  const elements = useRef(new Map<string, HTMLElement>());
  const columnMemory = useRef<Record<number, number>>({});
  const refCallbacks = useRef(new Map<string, (el: HTMLElement | null) => void>());

  // Adjusted during render (not in an effect) to avoid an extra commit:
  // - resetKey changed → jump to initialFocus;
  // - grid shape changed → clamp so focus never points to a missing item.
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const isReset = resetKey !== prevResetKey;
  const current = clampPosition(stableRows, isReset ? initialFocus : focus) ?? ORIGIN;
  if (isReset) setPrevResetKey(resetKey);
  if (!samePosition(current, focus)) setFocus(current);

  const latest = useRef({ scrollIntoView, screenKey });
  useEffect(() => {
    latest.current = { scrollIntoView, screenKey };
  });

  // Move real DOM focus + scroll whenever the logical focus changes.
  useEffect(() => {
    const element = elements.current.get(keyOf(current.row, current.col));
    if (!element) return;
    if (document.activeElement !== element) element.focus({ preventScroll: true });
    latest.current.scrollIntoView(element, current);
    columnMemory.current[current.row] = current.col;
    if (latest.current.screenKey) saveFocus(latest.current.screenKey, current);
  }, [current.row, current.col, rowsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useRemoteKeys((action) => {
    // Recover DOM focus if something stole it (mouse click on background, removed node).
    const element = elements.current.get(keyOf(current.row, current.col));
    if (element && document.activeElement !== element) element.focus({ preventScroll: true });

    if (onBeforeKey?.(action)) return true;

    switch (action) {
      case 'up':
      case 'down':
      case 'left':
      case 'right': {
        const next = moveFocus(stableRows, current, action, columnMemory.current as ColumnMemory);
        if (!samePosition(next, current)) setFocus(next);
        return true;
      }
      case 'select':
        onSelect?.(current);
        return true;
      case 'back':
        onBack?.();
        return true;
      default:
        return onAction?.(action, current) ?? false;
    }
  }, enabled);

  const getItemProps = useCallback(
    (row: number, col: number): FocusableProps => {
      const key = keyOf(row, col);
      let refCallback = refCallbacks.current.get(key);
      if (!refCallback) {
        refCallback = (el: HTMLElement | null) => {
          if (el) elements.current.set(key, el);
          else elements.current.delete(key);
        };
        refCallbacks.current.set(key, refCallback);
      }
      const isFocused = current.row === row && current.col === col;
      return {
        ref: refCallback,
        tabIndex: isFocused ? 0 : -1,
        'data-focused': isFocused,
        // Pointer/touch fallback (e.g. LG Magic Remote, desktop mouse).
        onClick: () => {
          setFocus({ row, col });
          onSelect?.({ row, col });
        },
        onFocus: () => {
          if (!isFocused) setFocus({ row, col });
        },
      };
    },
    [current.row, current.col, onSelect], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { focus: current, setFocus, getItemProps };
}
