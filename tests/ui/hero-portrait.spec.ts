import { expect, test, type Locator, type Page } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'hover is checked with a mouse on desktop');
});

const opacity = (el: Locator) => el.evaluate((e) => Number(getComputedStyle(e).opacity));

async function hover(page: Page, el: Locator) {
  await el.scrollIntoViewIfNeeded();
  const box = (await el.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

test('a 가나다 letter shows faintly in the grid paper cell under the pointer', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  // The top left cell is clear of the photo.
  const cell = page.locator('.hero-grid-letters .grid-cell').first();
  const letter = cell.locator('text');
  await expect(letter).toHaveText('가');
  expect(await opacity(letter)).toBe(0);

  await hover(page, cell.locator('rect'));
  await expect.poll(() => opacity(letter)).toBeGreaterThan(0.3);
  await page.mouse.move(0, 0);
  await expect.poll(() => opacity(letter), { timeout: 4000 }).toBe(0);
});

test('the sun glows under the pointer', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const halo = page.locator('.scene-day .scene-halo').first();
  expect(await opacity(halo)).toBe(0);
  await hover(page, page.locator('.scene-sun'));
  await expect.poll(() => opacity(halo)).toBeGreaterThan(0.3);
});
