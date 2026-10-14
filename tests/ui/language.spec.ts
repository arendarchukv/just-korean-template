import { expect, test } from '@playwright/test';

test.describe('language menu', () => {
  test('lists every language in its own name and keeps the current page', async ({ page }) => {
    await page.goto('/classes/');
    const menu = page.locator('[data-lang-menu]');
    const button = menu.locator('summary');
    await expect(button).toHaveAccessibleName(/Language: English/);
    await button.click();

    const items = menu.getByRole('link');
    await expect(items).toHaveText(['English', '한국어']);
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

test.describe('site info (demo)', () => {
  test('is in the main menu in both languages', async ({ page }) => {
    for (const path of ['/', '/ko/']) {
      await page.goto(path);
      // Desktop bar and phone menu each carry it.
      await expect(page.locator('header nav a[href="/site-info/"]')).toHaveCount(2);
    }
  });

  test('shows every Pages CMS form, and a box in the map jumps to its form', async ({ page }) => {
    await page.goto('/site-info/');
    await expect(page.getByRole('link', { name: 'Content', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('article.unit')).toHaveCount(8);

    const lessons = page.locator('#unit-lessons');
    await expect(lessons.getByText('Lesson text')).toBeVisible();
    await expect(lessons.getByText('Link to Series')).toBeVisible();

    await page.locator('.diagram [data-node="quizzes"]').click();
    await expect(page).toHaveURL(/#unit-quizzes$/);
    await expect(page.locator('#unit-quizzes')).toBeInViewport();
  });

  test('has the design system as its second tab', async ({ page }) => {
    await page.goto('/site-info/');
    await page.getByRole('link', { name: 'Design system' }).click();
    await expect(page).toHaveURL(/\/site-info\/design\/$/);
    await expect(page.getByRole('heading', { name: 'Paper & cut-outs' })).toBeVisible();
  });
});
