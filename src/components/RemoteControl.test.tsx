import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RemoteControl } from './RemoteControl';

describe('RemoteControl (on-screen)', () => {
  it('dispatches the same keydown events as a physical remote', () => {
    const keys: string[] = [];
    const onKey = (e: KeyboardEvent) => keys.push(`${e.key}|${e.code}`);
    window.addEventListener('keydown', onKey);
    render(<RemoteControl />);

    fireEvent.click(screen.getByTestId('remote-up'));
    fireEvent.click(screen.getByTestId('remote-select'));
    fireEvent.click(screen.getByTestId('remote-back'));
    fireEvent.click(screen.getByTestId('remote-diagnostics'));
    fireEvent.click(screen.getByTestId('remote-playPause'));
    window.removeEventListener('keydown', onKey);

    expect(keys).toEqual(['ArrowUp|ArrowUp', 'Enter|Enter', 'Escape|Escape', 'd|KeyD', 'MediaPlayPause|MediaPlayPause']);
  });

  it('never steals focus from the app and stays out of the accessibility tree', () => {
    render(<RemoteControl />);
    expect(screen.getByTestId('remote-control')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryAllByRole('button')).toHaveLength(0); // hidden from assistive tech
    const ok = screen.getByTestId('remote-select');
    expect(ok).toHaveAttribute('tabindex', '-1');
    const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    ok.dispatchEvent(mouseDown);
    expect(mouseDown.defaultPrevented).toBe(true);
  });

  it('lights up the matching button when a physical key is pressed', () => {
    vi.useFakeTimers();
    render(<RemoteControl />);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('remote-left')).toHaveClass('is-pressed');
    vi.advanceTimersByTime(200);
    vi.useRealTimers();
  });
});
