import { expect, test } from '@playwright/test';

test('the search narrows the list and says when nothing matches', async ({ page }) => {
  await page.goto('/grammar/');
  const search = page.getByRole('searchbox', { name: /search/i });
  await search.fill('도록');
  await expect(page.getByRole('link', { name: /^-도록/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^-게\s/ })).toBeHidden();
  await search.fill('zzzz');
  await expect(page.getByRole('status')).toContainText(/no patterns/i);
  await search.fill('');
  await expect(page.getByRole('link', { name: /^-게\s/ })).toBeVisible();
});

test('without JavaScript the full list shows and the search is hidden', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/grammar/');
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^-게\s/ })).toBeVisible();
  await context.close();
});

test('a pattern link is named by its pattern and its meaning', async ({ page }) => {
  await page.goto('/grammar/');
  await expect(page.getByRole('link', { name: /^-도록\s+So that; to the point/ })).toBeVisible();
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
  await expect(page.getByRole('link', { name: /^-게\s/ })).toBeHidden();
  await expect(page.getByRole('link', { name: /^-도록/ })).toBeVisible();
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
  await expect(page.getByRole('link', { name: /^-게\s/ })).toBeHidden();
});
