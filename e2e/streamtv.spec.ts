import { expect, test, type Page } from '@playwright/test';

/**
 * Every interaction uses the keyboard only, as a remote control would.
 * Playback tests need internet access to the public test streams.
 */
const focused = (page: Page) => page.locator(':focus');

async function press(page: Page, ...keys: string[]) {
  for (const key of keys) await page.keyboard.press(key);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-page')).toBeVisible();
});

test('navigates the catalog with the D-pad, opens a detail and returns keeping focus', async ({ page }) => {
  await expect(focused(page)).toHaveAttribute('data-testid', 'hero-play');

  await press(page, 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowRight');
  await expect(focused(page)).toHaveAttribute('data-testid', 'card-mareas-de-neon');
  await expect(focused(page)).toBeInViewport();

  await press(page, 'Enter');
  await expect(page.getByTestId('detail-page')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mareas de Neón');
  await expect(focused(page)).toHaveAttribute('data-testid', 'detail-play');

  await press(page, 'Escape');
  await expect(page.getByTestId('home-page')).toBeVisible();
  await expect(focused(page)).toHaveAttribute('data-testid', 'card-mareas-de-neon');
  await expect(focused(page)).toBeInViewport();

  // Column memory: going up and back down returns to the same card.
  await press(page, 'ArrowUp', 'ArrowDown');
  await expect(focused(page)).toHaveAttribute('data-testid', 'card-mareas-de-neon');
});

test('plays a real DASH stream with Shaka, shows QoE metrics and returns with focus', async ({ page }) => {
  // Hero → "Más información" (Sintel) → Reanudar/Reproducir
  await press(page, 'ArrowRight', 'Enter');
  await expect(page.getByTestId('detail-page')).toBeVisible();
  const playButton = focused(page);
  const playTestId = await playButton.getAttribute('data-testid');
  await press(page, 'Enter');

  const player = page.getByTestId('player-page');
  await expect(player).toBeVisible();
  await expect(player).toHaveAttribute('data-status', 'playing', { timeout: 30_000 });
  await expect(focused(page)).toHaveAttribute('data-testid', 'control-play-pause');

  // The video is really advancing.
  const t1 = await page.getByTestId('player-video').evaluate((v: HTMLVideoElement) => v.currentTime);
  await page.waitForTimeout(1500);
  const t2 = await page.getByTestId('player-video').evaluate((v: HTMLVideoElement) => v.currentTime);
  expect(t2).toBeGreaterThan(t1);

  // Pause via the focused control, then seek +10 s with the D-pad.
  await press(page, 'Enter');
  await expect(player).toHaveAttribute('data-status', 'paused');
  const before = await page.getByTestId('player-video').evaluate((v: HTMLVideoElement) => v.currentTime);
  await press(page, 'ArrowRight', 'Enter');
  await expect
    .poll(() => page.getByTestId('player-video').evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(before + 9);

  // Diagnostics: real startup time, never invented.
  await press(page, 'd');
  const panel = page.getByTestId('diagnostics-panel');
  await expect(panel).toBeVisible();
  await expect(page.getByTestId('diag-startup')).toHaveText(/\d+(\.\d+)? (ms|s)/);
  await expect(page.getByTestId('diag-errors')).toHaveText('0');
  await press(page, 'd');
  await expect(panel).toBeHidden();

  // Back: player is unmounted (resources released) and focus is restored.
  await press(page, 'Backspace');
  await expect(page.getByTestId('player-page')).toHaveCount(0);
  await expect(focused(page)).toHaveAttribute('data-testid', playTestId!);
  await press(page, 'Escape');
  await expect(focused(page)).toHaveAttribute('data-testid', 'hero-info');
});

test('shows an error state for a missing manifest and keeps the remote usable', async ({ page }) => {
  // "Laboratorio de streaming" is the last rail; the error title is its 4th card.
  await press(page, 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown');
  await press(page, 'ArrowRight', 'ArrowRight', 'ArrowRight');
  await expect(focused(page)).toHaveAttribute('data-testid', 'card-senal-error');
  await press(page, 'Enter', 'Enter');

  const dialog = page.getByRole('alert');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(dialog).toContainText('NETWORK');
  await expect(focused(page)).toHaveAttribute('data-testid', 'player-retry');

  await press(page, 'ArrowRight', 'Enter');
  await expect(page.getByTestId('detail-page')).toBeVisible();
});

test('retry recovers playback after a transient network failure', async ({ page }) => {
  let failManifest = true;
  await page.route('**/sintel/dash.mpd', (route) => (failManifest ? route.abort('internetdisconnected') : route.continue()));

  await press(page, 'Enter'); // hero "Reproducir" → Sintel
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 30_000 });
  await expect(focused(page)).toHaveAttribute('data-testid', 'player-retry');

  failManifest = false;
  await press(page, 'Enter');
  await expect(page.getByTestId('player-page')).toHaveAttribute('data-status', 'playing', { timeout: 30_000 });

  await press(page, 'd');
  // The failed attempt is still recorded by the QoE tracker.
  await expect(page.getByTestId('diag-errors')).not.toHaveText('0');
});

test('basic accessibility: language, landmarks, names and visible focus', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sintel');
  await expect(page.getByRole('region', { name: 'Continuar viendo' })).toBeVisible();

  const buttons = page.getByRole('button');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(10);
  for (let i = 0; i < count; i++) {
    const name = await buttons.nth(i).evaluate((el) => el.getAttribute('aria-label') ?? el.textContent ?? '');
    expect(name.trim(), `button #${i} needs an accessible name`).not.toBe('');
  }

  // Only one element is in the tab order (roving tabindex).
  await expect(page.locator('[tabindex="0"]')).toHaveCount(1);

  // The focused card is visibly different from an unfocused one.
  await press(page, 'ArrowDown');
  const focusedCard = focused(page);
  const transform = await focusedCard.evaluate((el) => getComputedStyle(el).transform);
  expect(transform).not.toBe('none');
});
