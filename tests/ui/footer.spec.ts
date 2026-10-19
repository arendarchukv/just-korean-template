import { expect, test } from '@playwright/test';

// Grammar is not in the header menu (owner's wish); the footer is the way to it from any page.
test('the footer lists the site pages, Grammar among them', async ({ page }) => {
  await page.goto('/uk/materials/');
  const pages = page.locator('footer [data-footer-pages]');
  await expect(pages.getByRole('link')).toHaveText([
    'Безкоштовні уроки',
    'Граматика',
    'Матеріали',
    'Практика',
    'Заняття з JiEun',
  ]);
  await pages.getByRole('link', { name: 'Граматика' }).click();
  await expect(page).toHaveURL(/\/uk\/grammar\/$/);
});
