import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

// The player is covered by PlayerPage.test; keep Shaka out of the App flow test.
vi.mock('./player/shakaEngine', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./player/shakaEngine')>()),
  createShakaEngine: vi.fn<() => Promise<never>>(() => new Promise(() => {})),
}));

const press = (key: string) => fireEvent.keyDown(window, { key });
const focusedTestId = () => document.activeElement?.getAttribute('data-testid');

describe('App navigation flow', () => {
  it('starts with focus on the hero play button', () => {
    render(<App />);
    expect(focusedTestId()).toBe('hero-play');
  });

  it('opens a detail page and restores the catalog focus on back', () => {
    render(<App />);
    press('ArrowDown'); // "Continuar viendo"
    press('ArrowDown'); // "Tendencias"
    press('ArrowRight');
    press('ArrowRight');
    expect(focusedTestId()).toBe('card-codigo-andino');

    press('Enter');
    expect(screen.getByTestId('detail-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Código Andino' })).toBeInTheDocument();
    expect(focusedTestId()).toMatch(/^detail-(play|resume)$/);

    press('Escape');
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(focusedTestId()).toBe('card-codigo-andino');
  });

  it('opens the player from the detail page and returns to the detail focus', () => {
    render(<App />);
    press('ArrowRight'); // "Más información"
    press('Enter');
    expect(screen.getByTestId('detail-page')).toBeInTheDocument();

    press('Enter'); // play / resume
    expect(screen.getByTestId('player-page')).toBeInTheDocument();
    expect(screen.queryByTestId('detail-page')).not.toBeInTheDocument();

    press('Backspace');
    expect(screen.getByTestId('detail-page')).toBeInTheDocument();
    expect(focusedTestId()).toMatch(/^detail-(play|resume)$/);

    press('Escape');
    expect(focusedTestId()).toBe('hero-info');
  });

  it('exposes accessible names for every focusable control on Home', () => {
    render(<App />);
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAccessibleName();
    }
    expect(screen.getByRole('region', { name: 'Tendencias' })).toBeInTheDocument();
  });
});
