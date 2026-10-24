import { expect, test } from '@playwright/test';

// Needs `holiday: auto` (or a holiday) in src/content/settings/site.yml.
const greeting = (page: import('@playwright/test').Page, text: RegExp) =>
  page.locator('[data-holiday-greeting]').filter({ hasText: text });

test('Automatic shows a holiday on its dates only', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-24T10:00:00'));
  await page.goto('/');
  await expect(greeting(page, /Happy Chuseok/)).toBeVisible();
  await page.clock.setFixedTime(new Date('2026-09-28T10:00:00'));
  await page.reload();
  await expect(page.locator('[data-holiday-greeting]:visible')).toHaveCount(0);
});

// DEMO ONLY: the floating preview switch.
test('the preview switch shows a holiday for the whole visit', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-06-01T10:00:00'));
  await page.goto('/');
  const select = page.getByRole('combobox', { name: 'Holiday preview' });
  await select.selectOption('chuseok');
  await expect(greeting(page, /Happy Chuseok/)).toBeVisible();
  await page.reload();
  await expect(greeting(page, /Happy Chuseok/)).toBeVisible();
  await page.goto('/ko/');
  await expect(greeting(page, /즐거운 추석/)).toBeVisible();
  await page.getByRole('combobox', { name: 'Holiday preview' }).selectOption('none');
  await expect(page.locator('[data-holiday-greeting]:visible')).toHaveCount(0);
});
