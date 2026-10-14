import { expect, test, type Page } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'widgets are checked on desktop');
});

const DECK = '/practice/deck/negative-form/';

/** Open the deck and wait until the island has hydrated (client:visible), so clicks work. */
async function open(page: Page) {
  await page.goto(DECK);
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', /.*/);
}

test('cards flip, count what is known, and offer the rest at the end', async ({ page }) => {
  await open(page);
  const card = page.getByRole('button', { name: /안 가요/ });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.getByText("I don't go", { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'I know it' }).click();

  // Second card: flip with the keyboard, then "Again".
  const second = page.getByRole('button', { name: /가지 않아요/ });
  await second.focus();
  await page.keyboard.press('Space');
  await expect(page.getByText("I don't go (more formal)")).toBeVisible();
  await page.getByRole('button', { name: 'Again' }).click();

  await expect(page.getByRole('status')).toContainText('You know 1 of 2');
  await page.getByRole('button', { name: 'Practise the rest' }).click();
  await expect(page.getByRole('button', { name: /가지 않아요/ })).toBeVisible();
});

test('known cards are remembered after a reload, and "Start over" forgets them', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: /안 가요/ }).click();
  await page.getByRole('button', { name: 'I know it' }).click();
  await page.reload();
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', /.*/);
  // The known card is skipped: practice starts with the one still to learn.
  await expect(page.getByRole('button', { name: /가지 않아요/ })).toBeVisible();
  await page.getByRole('button', { name: /가지 않아요/ }).click();
  await page.getByRole('button', { name: 'I know it' }).click();
  await expect(page.getByRole('status')).toContainText('You know 2 of 2');
  await expect(page.getByRole('button', { name: 'Practise the rest' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByRole('button', { name: /안 가요/ })).toBeVisible();
  await page.reload();
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', /.*/);
  await expect(page.getByRole('button', { name: /안 가요/ })).toBeVisible();
});

test('the deck works when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await open(page);
  await page.getByRole('button', { name: /안 가요/ }).click();
  await page.getByRole('button', { name: 'I know it' }).click();
  await expect(page.getByRole('button', { name: /가지 않아요/ })).toBeVisible();
});

test('focus stays on the card after an answer, and the meaning is announced', async ({ page }) => {
  await open(page);
  const card = page.getByRole('button', { name: /안 가요/ });
  await card.focus();
  await page.keyboard.press('Enter');
  // The meaning is read out from a live region; the card keeps its name.
  await expect(page.locator('[aria-live="polite"]').first()).toContainText("I don't go");
  await expect(card).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'I know it' }).click();
  await expect(page.getByRole('button', { name: /가지 않아요/ })).toBeFocused();
});

test('a deck already learned opens on its end screen', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('jk:deck:negative-form', JSON.stringify(['안 가요', '가지 않아요'])),
  );
  await open(page);
  await expect(page.getByRole('status')).toContainText('You know 2 of 2');
  await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible();
});

test('stale or broken stored progress does not break the deck', async ({ page }) => {
  // Seed broken data once (an init script runs again on reload).
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('jk:deck:negative-form', '5');
  });
  await open(page);
  await expect(page.getByRole('button', { name: /안 가요/ })).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem('jk:deck:negative-form', JSON.stringify(['removed card', '안 가요'])),
  );
  await page.reload();
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', /.*/);
  await expect(page.getByText('1 known')).toBeVisible();
});

test('without JavaScript only the readable list shows, not a dead widget', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(DECK);
  await expect(page.locator('.widget')).toBeHidden();
  await expect(page.locator('.widget-fallback')).toBeVisible();
  await context.close();
});
