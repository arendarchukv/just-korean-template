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

test.describe('pager', () => {
  /** Serve the page with one row per page, so the two demo rows of a tab make two pages. */
  const onePerPage = async (page: Page) => {
    await page.route('**/materials/', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace('data-page-size="20"', 'data-page-size="1"');
      await route.fulfill({ response, body });
    });
  };

  test('is hidden while a tab fits on one page', async ({ page }) => {
    await page.goto('/materials/');
    await expect(page.locator('#mat-class [data-mat-pager]')).toBeHidden();
  });

  test('splits a long tab into pages and moves between them', async ({ page }) => {
    await onePerPage(page);
    await page.goto('/materials/');
    const rows = page.locator('#mat-class [data-mat-row]');
    const pager = page.getByRole('navigation', { name: 'Pages' }).first();
    await expect(pager).toBeVisible();
    await expect(rows.filter({ visible: true })).toHaveCount(1);
    await expect(page.getByText('Showing 1–1 of 2')).toBeVisible();
    await pager.getByRole('button', { name: 'Page 2' }).click();
    await expect(pager.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByText('Showing 2–2 of 2')).toBeVisible();
    await expect(pager.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await pager.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByText('Showing 1–1 of 2')).toBeVisible();
  });

  test('pages what the filter leaves, starting again from page 1', async ({ page }) => {
    await onePerPage(page);
    await page.goto('/materials/');
    const pager = page.getByRole('navigation', { name: 'Pages' }).first();
    await pager.getByRole('button', { name: 'Page 2' }).click();
    await page.getByRole('combobox', { name: /type/i }).selectOption('writing');
    await expect(page.locator('#mat-class [data-mat-row]').filter({ visible: true })).toHaveCount(
      1,
    );
    await expect(pager).toBeHidden();
  });
});

test('the current page number stays readable under the mouse', async ({ page }) => {
  await page.route('**/materials/', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace('data-page-size="20"', 'data-page-size="1"');
    await route.fulfill({ response, body });
  });
  await page.goto('/materials/');
  const current = page.getByRole('button', { name: 'Page 1' }).first();
  await current.hover();
  const [color, background] = await current.evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.color, s.backgroundColor];
  });
  expect(color).not.toBe(background);
});
