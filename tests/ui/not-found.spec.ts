import { expect, test } from '@playwright/test';

test('a missing page offers the main sections, in the page language', async ({ page }) => {
  // Cloudflare serves es/404.html for a missing /es/... address; the local preview does not.
  await page.goto('/es/404.html');
  const links = page.locator('[data-not-found-links]');
  await expect(links.getByRole('link')).toHaveText([
    'Lecciones gratis',
    'Gramática',
    'Práctica',
    'Materiales',
  ]);
  await links.getByRole('link', { name: 'Gramática' }).click();
  await expect(page).toHaveURL(/\/es\/grammar\/$/);
});
