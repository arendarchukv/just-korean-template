import { expect, test, type Page } from '@playwright/test';

// The mobile menu exists below the md breakpoint, so these run in the mobile project only.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile menu is checked on mobile only');
});

const menu = (page: Page) => page.locator('header details[data-mobile-menu]');
const toggle = (page: Page) => menu(page).locator('summary');

async function openMenu(page: Page) {
  await page.goto('/classes/');
  await toggle(page).click();
  await expect(menu(page)).toHaveAttribute('open', '');
}

test('opening the menu locks page scroll; closing unlocks it', async ({ page }) => {
  await openMenu(page);
  await expect(page.locator('html')).toHaveAttribute('data-menu-open', '');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
    'hidden',
  );
  await toggle(page).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-menu-open', '');
});

test('Escape closes the menu and returns focus to the toggle', async ({ page }) => {
  await openMenu(page);
  await page.getByRole('link', { name: 'Materials' }).last().focus();
  await page.keyboard.press('Escape');
  await expect(menu(page)).not.toHaveAttribute('open', '');
  await expect(toggle(page)).toBeFocused();
});

test('tapping the backdrop closes the menu', async ({ page }) => {
  await openMenu(page);
  const backdrop = page.locator('[data-menu-backdrop]');
  await expect(backdrop).toBeVisible();
  // Near the bottom of the visible screen: below the menu panel, on the backdrop.
  const viewport = page.viewportSize()!;
  await page.mouse.click(viewport.width / 2, viewport.height - 40);
  await expect(menu(page)).not.toHaveAttribute('open', '');
});

test('widening the window to desktop closes the menu and releases the scroll lock', async ({
  page,
}) => {
  await openMenu(page);
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(menu(page)).not.toHaveAttribute('open', '');
  await expect(page.locator('html')).not.toHaveAttribute('data-menu-open', '');
});

test('page does not shift sideways when the scroll lock removes the scrollbar', async ({
  page,
}) => {
  await page.goto('/classes/');
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter),
  ).toBe('stable');
});
