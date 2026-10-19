import { expect, test, type Page } from '@playwright/test';

/** Titles of the cards in view, in their order on the page. */
const titles = (page: Page) => page.locator('[data-lessons-grid] li:visible .lesson-title');
const status = (page: Page) => page.locator('[data-lessons-status]');

test('every lesson is the same card in one grid, newest first, 24 a page', async ({ page }) => {
  await page.goto('/lessons/');
  // Named like the menu item that leads here.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Free lessons');
  await expect(page.locator('.course-list')).toHaveCount(0);
  await expect(titles(page)).toHaveCount(24);
  await expect(titles(page).first()).toContainText('환향녀 이야기');
  await expect(status(page)).toHaveText('141 lessons');
});

test('a course lesson says where it sits in the course', async ({ page }) => {
  await page.goto('/lessons/?playlist=crash-course');
  await expect(
    page.locator('[data-lessons-grid] li:visible .lesson-meta', { hasText: 'Lesson 4' }),
  ).toContainText('Beginner Korean Crash Course');
});

test('choosing a course shows its lessons in order with its description', async ({ page }) => {
  await page.goto('/lessons/');
  await page.locator('label', { hasText: 'Beginner Korean Crash Course' }).click();
  await expect(page).toHaveURL(/\/lessons\/\?playlist=crash-course$/);
  await expect(titles(page)).toHaveCount(10);
  await expect(titles(page).first()).toContainText('1.');
  await expect(titles(page).last()).toContainText('10.');
  await expect(page.getByText('Ten short lessons')).toBeVisible();
  await page.locator('label', { hasText: /^All/ }).click();
  await expect(status(page)).toHaveText('141 lessons');
  await expect(page.getByText('Ten short lessons')).toBeHidden();
});

test('level and search narrow the grid; a pattern finds its lessons', async ({ page }) => {
  await page.goto('/lessons/');
  await page.getByRole('combobox', { name: 'Level' }).selectOption('advanced');
  await expect(titles(page)).toHaveCount(4);
  await page.getByRole('combobox', { name: 'Level' }).selectOption('');
  await page.getByRole('searchbox', { name: 'Search lessons or patterns' }).fill('도록');
  await expect(titles(page)).toHaveCount(2);
  await expect(titles(page).filter({ hasText: '게 vs 도록' })).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Search lessons or patterns' }).fill('zzz');
  await expect(titles(page)).toHaveCount(0);
  await expect(status(page)).toContainText('No lessons match');
});

test('a lesson links back to its playlist, opened on the Lessons page', async ({ page }) => {
  await page.goto('/lessons/ge-vs-dorok/');
  await page.locator('.lesson-head').getByRole('link', { name: 'Grammar' }).click();
  await expect(page).toHaveURL(/\/lessons\/\?playlist=grammar$/);
  await expect(page.getByRole('radio', { name: /Grammar/ })).toBeChecked();
  await expect(status(page)).toHaveText('52 lessons');
});

test('the pager pages through the list and restarts on page 1 after a filter', async ({ page }) => {
  await page.goto('/lessons/');
  const pager = page.getByRole('navigation', { name: 'Pages' });
  await expect(pager.getByText('Showing 1–24 of 141')).toBeVisible();
  await pager.getByRole('button', { name: 'Page 6' }).click();
  await expect(titles(page)).toHaveCount(21);
  await expect(pager.getByText('Showing 121–141 of 141')).toBeVisible();
  await expect(pager.getByRole('button', { name: 'Next page' })).toBeDisabled();
  // A new filter starts again from page 1; the pager hides once everything fits.
  await page.locator('label', { hasText: 'Beginner Korean Crash Course' }).click();
  await expect(titles(page)).toHaveCount(10);
  await expect(pager).toBeHidden();
  await page.locator('label', { hasText: /^All/ }).click();
  await expect(pager.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('the filters live in the address, so Back from a lesson returns to the same view', async ({
  page,
}) => {
  await page.goto('/lessons/');
  await page.locator('label', { hasText: 'Grammar' }).first().click();
  await page.getByRole('combobox', { name: 'Level' }).selectOption('intermediate');
  await page.getByRole('searchbox', { name: 'Search lessons or patterns' }).fill('vs');
  await expect(page).toHaveURL(/\?playlist=grammar&level=intermediate&q=vs$/);
  const count = await status(page).textContent();
  await titles(page).first().click();
  await expect(page.locator('.lesson-head')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('radio', { name: /Grammar/ })).toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Level' })).toHaveValue('intermediate');
  await expect(page.getByRole('searchbox', { name: 'Search lessons or patterns' })).toHaveValue(
    'vs',
  );
  await expect(status(page)).toHaveText(count!);
});

test('the page number is kept in the address too', async ({ page }) => {
  await page.goto('/lessons/?page=3');
  const pager = page.getByRole('navigation', { name: 'Pages' });
  await expect(pager.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await pager.getByRole('button', { name: 'Page 4' }).click();
  await expect(page).toHaveURL(/\/lessons\/\?page=4$/);
  // A new filter starts again from page 1, which the address leaves out.
  await page.locator('label', { hasText: 'Beginner Korean Crash Course' }).click();
  await expect(page).toHaveURL(/\/lessons\/\?playlist=crash-course$/);
});

test('when nothing matches, one button clears every filter', async ({ page }) => {
  await page.goto('/lessons/?playlist=podcast&level=advanced&q=zzz');
  const clear = page.getByRole('button', { name: 'Clear filters' });
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(status(page)).toHaveText('141 lessons');
  await expect(page).toHaveURL(/\/lessons\/$/);
  await expect(page.getByRole('searchbox', { name: 'Search lessons or patterns' })).toBeFocused();
  await expect(clear).toBeHidden();
});

test('a format filter separates lessons with a video from those without', async ({ page }) => {
  await page.goto('/lessons/');
  const format = page.getByRole('combobox', { name: 'Format' });
  await format.selectOption('text');
  await expect(page).toHaveURL(/\/lessons\/\?format=text$/);
  await expect(titles(page)).toHaveText(['환향녀 이야기', '곰과 호랑이 이야기 (단군 신화)']);
  await format.selectOption('video');
  await expect(status(page)).toHaveText('139 lessons');
  // Clear filters resets it too.
  await page.getByRole('searchbox', { name: 'Search lessons or patterns' }).fill('zzz');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(format).toHaveValue('');
  await expect(status(page)).toHaveText('141 lessons');
});

test('the home page shows the three newest lessons, a lesson without video among them', async ({
  page,
}) => {
  await page.goto('/');
  const cards = page.locator('[data-home-block="new-lessons"] .lesson-title');
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toHaveText('환향녀 이야기');
});
