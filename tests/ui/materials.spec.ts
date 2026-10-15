import { expect, test, type Page } from '@playwright/test';

const tab = (name: RegExp) => ({ name });
/** A material's title cell (its name also appears, hidden, in its file links). */
const title = (page: Page, text: string) => page.locator('.mat-title', { hasText: text });

test('tabs switch the table; the first tab is open, the others hidden', async ({ page }) => {
  await page.goto('/materials/');
  const classTab = page.getByRole('tab', tab(/class materials/i));
  const podcastTab = page.getByRole('tab', tab(/podcast/i));
  await expect(classTab).toHaveAttribute('aria-selected', 'true');
  await expect(title(page, '한국의 가족')).toBeVisible();
  await expect(title(page, '한국 겨울 간식')).toBeHidden();

  await podcastTab.click();
  await expect(podcastTab).toHaveAttribute('aria-selected', 'true');
  await expect(title(page, '한국 겨울 간식')).toBeVisible();
  await expect(title(page, '한국의 가족')).toBeHidden();
  await expect(page).toHaveURL(/#mat-podcast$/);
});

test('arrow keys move between tabs (the tab pattern)', async ({ page }) => {
  await page.goto('/materials/');
  const first = page.getByRole('tab').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab').nth(1)).toBeFocused();
  await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(first).toBeFocused();
});

test('files added to a lesson have their own tab and link to the lesson', async ({ page }) => {
  await page.goto('/materials/#mat-from-lessons');
  const fromLessons = page.getByRole('tab', tab(/from lessons/i));
  await expect(fromLessons).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('link', { name: 'Korean numbers and how to use them', exact: true }),
  ).toHaveAttribute('href', '/lessons/korean-numbers/');
});

test('the type filter and the title search narrow the open tab', async ({ page }) => {
  await page.goto('/materials/');
  const rows = page.locator('#mat-class [data-mat-row]');
  await expect(rows.filter({ visible: true })).toHaveCount(2);
  await page.getByRole('combobox', { name: /type/i }).selectOption('writing');
  await expect(rows.filter({ visible: true })).toHaveCount(1);
  await expect(title(page, '높임말 표현')).toBeVisible();
  await page.getByRole('searchbox', { name: /search/i }).fill('zzzz');
  await expect(page.getByRole('status')).toContainText(/no materials/i);
});

test('without JavaScript every section shows one after another, no tabs', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/materials/');
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(title(page, '한국의 가족')).toBeVisible();
  await expect(title(page, '한국 겨울 간식')).toBeVisible();
  await expect(page.getByRole('heading', { name: /from lessons/i })).toBeVisible();
  await context.close();
});
