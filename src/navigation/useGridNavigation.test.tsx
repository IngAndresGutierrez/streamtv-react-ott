import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GridPosition } from '../types/navigation';
import { clearFocusMemory } from './focusMemory';
import { useGridNavigation, type GridNavigationOptions } from './useGridNavigation';

type HarnessProps = Partial<GridNavigationOptions> & { rows: number[] };

function Harness(props: HarnessProps) {
  const { getItemProps } = useGridNavigation({ scrollIntoView: () => {}, ...props });
  return (
    <div>
      {props.rows.map((count, row) => (
        <div key={row}>
          {Array.from({ length: count }, (_, col) => (
            <button key={col} type="button" {...getItemProps(row, col)}>
              {`${row}-${col}`}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

const press = (key: string) => fireEvent.keyDown(window, { key });
const focused = () => document.activeElement?.textContent;

afterEach(() => clearFocusMemory());

describe('useGridNavigation', () => {
  it('focuses the initial item in the DOM', () => {
    render(<Harness rows={[2, 3]} initialFocus={{ row: 1, col: 2 }} />);
    expect(focused()).toBe('1-2');
  });

  it('moves real DOM focus with the arrow keys and keeps a roving tabindex', () => {
    render(<Harness rows={[2, 3]} />);
    press('ArrowRight');
    expect(focused()).toBe('0-1');
    press('ArrowDown');
    expect(focused()).toBe('1-1');
    expect(screen.getByText('1-1')).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('0-1')).toHaveAttribute('tabindex', '-1');
  });

  it('remembers the column per row when moving up and down', () => {
    render(<Harness rows={[3, 3]} />);
    press('ArrowDown');
    press('ArrowRight');
    press('ArrowRight'); // 1-2
    press('ArrowUp'); // 0-2 (clamped from same column)
    press('ArrowLeft'); // 0-1
    press('ArrowDown'); // back to remembered 1-2
    expect(focused()).toBe('1-2');
  });

  it('calls onSelect once on Enter (no extra native button click)', () => {
    const onSelect = vi.fn<(pos: GridPosition) => void>();
    render(<Harness rows={[2]} onSelect={onSelect} />);
    press('ArrowRight');
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    window.dispatchEvent(event);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({ row: 0, col: 1 });
    expect(event.defaultPrevented).toBe(true);
  });

  it('calls onBack for Escape and Backspace', () => {
    const onBack = vi.fn<() => void>();
    render(<Harness rows={[1]} onBack={onBack} />);
    press('Escape');
    press('Backspace');
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it('removes its keydown listener on unmount', () => {
    const onSelect = vi.fn<(pos: GridPosition) => void>();
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Harness rows={[1]} onSelect={onSelect} />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    press('Enter');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('ignores keys while disabled', () => {
    render(<Harness rows={[3]} enabled={false} />);
    screen.getByText('0-0').focus();
    press('ArrowRight');
    expect(focused()).toBe('0-0');
  });

  it('restores the last position for the same screenKey after a remount', () => {
    const first = render(<Harness rows={[2, 4]} screenKey="home" />);
    press('ArrowDown');
    press('ArrowRight');
    press('ArrowRight');
    expect(focused()).toBe('1-2');
    first.unmount();

    render(<Harness rows={[2, 4]} screenKey="home" />);
    expect(focused()).toBe('1-2');
  });

  it('keeps focus on a valid item when the grid shrinks', () => {
    const { rerender } = render(<Harness rows={[5]} initialFocus={{ row: 0, col: 4 }} />);
    expect(focused()).toBe('0-4');
    rerender(<Harness rows={[2]} initialFocus={{ row: 0, col: 4 }} />);
    expect(focused()).toBe('0-1');
  });

  it('jumps to initialFocus when resetKey changes', () => {
    const at = (col: number): GridPosition => ({ row: 0, col });
    const { rerender } = render(<Harness rows={[4]} initialFocus={at(2)} resetKey="a" />);
    press('ArrowRight');
    expect(focused()).toBe('0-3');
    rerender(<Harness rows={[4]} initialFocus={at(0)} resetKey="b" />);
    expect(focused()).toBe('0-0');
  });

  it('re-focuses the current item if DOM focus was lost', () => {
    render(<Harness rows={[2]} />);
    (document.activeElement as HTMLElement).blur();
    expect(document.activeElement).toBe(document.body);
    press('ArrowRight');
    expect(focused()).toBe('0-1');
  });
});
