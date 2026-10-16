import { expect, test, type Page } from '@playwright/test';

/** Titles of the cards in view, in their order on the page. */
const titles = (page: Page) => page.locator('[data-lessons-grid] li:visible .lesson-title');

test('every lesson is the same card in one grid, newest first', async ({ page }) => {
  await page.goto('/lessons/');
  await expect(page.locator('.course-list')).toHaveCount(0);
  await expect(titles(page)).toHaveCount(6);
  await expect(titles(page).first()).toContainText('(으)나 마나');
  // A course lesson says where it sits in the course, even among the others.
  await expect(page.locator('.lesson-meta', { hasText: 'Lesson 1' })).toContainText(
    'Beginner Korean Crash Course',
  );
  await expect(page.getByRole('status')).toHaveText('6 lessons');
});

test('choosing a course shows its lessons in order with its description', async ({ page }) => {
  await page.goto('/lessons/');
  await page.locator('label', { hasText: 'Beginner Korean Crash Course' }).click();
  await expect(page).toHaveURL(/#crash-course$/);
  await expect(titles(page)).toHaveText([/4\. Negative Form/, /6\. Location particles/]);
  await expect(page.getByText('Ten short lessons')).toBeVisible();
  await page.locator('label', { hasText: /^All/ }).click();
  await expect(titles(page)).toHaveCount(6);
  await expect(page.getByText('Ten short lessons')).toBeHidden();
});

test('level and search narrow the grid; a pattern finds its lesson', async ({ page }) => {
  await page.goto('/lessons/');
  await page.getByRole('combobox', { name: 'Level' }).selectOption('beginner');
  await expect(titles(page)).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Level' }).selectOption('');
  await page.getByRole('searchbox', { name: 'Search lessons or patterns' }).fill('도록');
  await expect(titles(page)).toHaveText([/게 vs 도록/]);
  await page.getByRole('searchbox', { name: 'Search lessons or patterns' }).fill('zzz');
  await expect(titles(page)).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('No lessons match');
});

test('a lesson links back to its playlist, opened on the Lessons page', async ({ page }) => {
  await page.goto('/lessons/ge-vs-dorok/');
  await page.locator('.lesson-head').getByRole('link', { name: 'Grammar' }).click();
  await expect(page).toHaveURL(/\/lessons\/#grammar$/);
  await expect(page.getByRole('radio', { name: /Grammar/ })).toBeChecked();
  await expect(titles(page)).toHaveCount(3);
});

test('"Show more" adds the next cards and moves focus to the first new one', async ({ page }) => {
  await page.route('**/lessons/', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace('data-page-size="24"', 'data-page-size="4"');
    await route.fulfill({ response, body });
  });
  await page.goto('/lessons/');
  await expect(titles(page)).toHaveCount(4);
  await expect(page.getByRole('status')).toHaveText('4 of 6 lessons');
  await page.getByRole('button', { name: 'Show more' }).click();
  await expect(titles(page)).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Show more' })).toBeHidden();
  await expect(page.locator('[data-lessons-grid] li:visible a').nth(4)).toBeFocused();
  // A new filter starts again from the first cards.
  await page.getByRole('combobox', { name: 'Level' }).selectOption('beginner');
  await page.getByRole('combobox', { name: 'Level' }).selectOption('');
  await expect(titles(page)).toHaveCount(4);
});
