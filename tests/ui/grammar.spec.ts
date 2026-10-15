import { expect, test, type Page } from '@playwright/test';

/** The row of one grammar tag (its pattern exactly). */
const row = (page: Page, tag: string) =>
  page.locator('.pattern-row').filter({
    has: page.locator('.pattern-name', { hasText: new RegExp(`^${tag}$`) }),
  });

test('the search narrows the list and says when nothing matches', async ({ page }) => {
  await page.goto('/grammar/');
  const search = page.getByRole('searchbox', { name: /search/i });
  await search.fill('도록');
  await expect(row(page, '-도록')).toBeVisible();
  await expect(row(page, '-게')).toBeHidden();
  await search.fill('zzzz');
  await expect(page.getByRole('status')).toContainText(/no patterns/i);
  await search.fill('');
  await expect(row(page, '-게')).toBeVisible();
});

test('without JavaScript the full list shows and the search is hidden', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/grammar/');
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(row(page, '-게')).toBeVisible();
  await context.close();
});

test('each pattern, typed as a tag on lessons, links the lessons that explain it', async ({
  page,
}) => {
  await page.goto('/grammar/');
  await expect(row(page, '-도록').getByRole('link')).toHaveAttribute(
    'href',
    '/lessons/ge-vs-dorok/',
  );
});

test('a pattern on a lesson page leads to that pattern on the grammar page', async ({ page }) => {
  await page.goto('/lessons/ge-vs-dorok/');
  await page.locator('.pattern-chip', { hasText: '-도록' }).click();
  await expect(page).toHaveURL(/\/grammar\/#g-/);
  await expect(row(page, '-도록')).toBeInViewport();
});

test('typing Korean does not flash "no results" while a syllable is being composed', async ({
  page,
}) => {
  await page.goto('/grammar/');
  const search = page.getByRole('searchbox', { name: /search/i });
  // Mid-composition the field holds a bare jamo; the filter waits for the syllable.
  await search.evaluate((el: HTMLInputElement) => {
    el.value = 'ㄷ';
    el.dispatchEvent(new InputEvent('input', { isComposing: true, bubbles: true }));
  });
  await expect(page.getByRole('status')).toHaveText('');
  await search.evaluate((el: HTMLInputElement) => {
    el.value = '도록';
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '도록' }));
  });
  await expect(row(page, '-게')).toBeHidden();
  await expect(row(page, '-도록')).toBeVisible();
});

test('a search kept by the browser (back/forward) is applied when the page loads', async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const input = document.querySelector<HTMLInputElement>('#grammar-q');
      if (input) input.value = '도록';
    });
  });
  await page.goto('/grammar/');
  await expect(row(page, '-게')).toBeHidden();
});
