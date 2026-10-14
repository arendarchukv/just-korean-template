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
