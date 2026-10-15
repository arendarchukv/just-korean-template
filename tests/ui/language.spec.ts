import { expect, test } from '@playwright/test';

test.describe('language menu', () => {
  test('lists every language in its own name and keeps the current page', async ({ page }) => {
    await page.goto('/classes/');
    const menu = page.locator('[data-lang-menu]');
    const button = menu.locator('summary');
    await expect(button).toHaveAccessibleName(/Language: English/);
    await button.click();

    const items = menu.getByRole('link');
    // Every language in its own name, in the order of locales.ts.
    await expect(items).toHaveText([
      'English',
      '한국어',
      'Español',
      'Bahasa Indonesia',
      'Українська',
    ]);
    await expect(items.first()).toHaveAttribute('aria-current', 'true');
    await expect(menu.getByRole('link', { name: '한국어' })).toHaveAttribute(
      'href',
      '/ko/classes/',
    );

    await menu.getByRole('link', { name: '한국어' }).click();
    await expect(page).toHaveURL(/\/ko\/classes\/$/);
    await expect(page.locator('[data-lang-menu] summary')).toHaveAccessibleName(/언어: 한국어/);
  });

  test('closes with Escape, returning focus to its button, and on a click outside', async ({
    page,
  }) => {
    await page.goto('/');
    const menu = page.locator('[data-lang-menu]');
    const button = menu.locator('summary');

    await button.click();
    await expect(menu).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(button).toBeFocused();

    await button.click();
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await expect(menu).not.toHaveAttribute('open', '');
  });
});
