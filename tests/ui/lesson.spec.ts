import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Never load YouTube in tests; the iframe element is what we check.
  await page.route(/youtube(-nocookie)?\.com/, (route) => route.abort());
});

test('clicking play swaps the thumbnail for a privacy-friendly player and moves focus to it', async ({
  page,
}) => {
  await page.goto('/lessons/ge-vs-dorok/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('link', { name: /play video/i }).click();
  const frame = page.locator('[data-video-facade] iframe');
  await expect(frame).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/R3Ny_hDzKpc/);
  await expect(frame).toBeFocused();
});

test('without JavaScript the play button is a link to YouTube', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/lessons/ge-vs-dorok/');
  await expect(page.getByRole('link', { name: /play video/i })).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=R3Ny_hDzKpc',
  );
  await context.close();
});

test('a course lesson links to its neighbours', async ({ page }) => {
  await page.goto('/lessons/negative-form/');
  await expect(page.getByRole('link', { name: /next/i })).toHaveAttribute(
    'href',
    '/lessons/location-particles/',
  );
});

test('the play button shows a focus ring that is not clipped by the frame', async ({ page }) => {
  await page.goto('/lessons/ge-vs-dorok/');
  const link = page.getByRole('link', { name: /play video/i });
  await link.focus();
  const clipped = await link.evaluate((el) => {
    const frame = el.closest('[data-video-facade]')!;
    const offset = parseFloat(getComputedStyle(el).outlineOffset);
    return getComputedStyle(frame).overflow === 'hidden' && offset >= 0;
  });
  expect(clipped).toBe(false);
});

test('Ctrl+click on play opens YouTube normally instead of the embedded player', async ({
  page,
}) => {
  await page.goto('/lessons/ge-vs-dorok/');
  const link = page.getByRole('link', { name: /play video/i });
  const swapped = await link.evaluate((el) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    el.dispatchEvent(event);
    return document.querySelector('[data-video-facade] iframe') !== null;
  });
  expect(swapped).toBe(false);
});

test('a lesson with its own words links to their flashcards page, named after the lesson', async ({
  page,
}) => {
  await page.goto('/lessons/negative-form/');
  await page.getByRole('link', { name: /flashcards/i }).click();
  await expect(page).toHaveURL(/\/practice\/deck\/negative-form\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Negative Form');
  await expect(
    page.getByRole('link', {
      name: 'Beginner Korean Intensive Course! 4. Negative Form',
      exact: true,
    }),
  ).toHaveAttribute('href', '/lessons/negative-form/');
});
