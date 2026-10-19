import { expect, test } from '@playwright/test';

// Grammar is not in the header menu (owner's wish); the footer is the way to it from any page.
test('the footer lists the learning pages, Grammar among them', async ({ page }) => {
  await page.goto('/uk/materials/');
  const pages = page.locator('footer [data-footer-pages]');
  await expect(pages.getByRole('link')).toHaveText([
    'Безкоштовні уроки',
    'Граматика',
    'Матеріали',
    'Практика',
  ]);
  await pages.getByRole('link', { name: 'Граматика' }).click();
  await expect(page).toHaveURL(/\/uk\/grammar\/$/);
});

test('her channels are icon buttons named for screen readers', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'YouTube' })).toHaveAttribute(
    'href',
    /youtube\.com/,
  );
  await expect(footer.getByRole('link', { name: 'YouTube' }).locator('svg')).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute('target', '_blank');
});
