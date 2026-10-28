import { expect, test } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the header toggle is checked on desktop');
});

const toggle = (page: import('@playwright/test').Page) =>
  page.locator('header [data-theme-toggle]').first();

test('the new theme spreads from the click like ink, then the page is plain again', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');

  await toggle(page).click();
  await expect(html).toHaveAttribute('data-ink', '');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  // The new page grows through a round mask: an animation on the view transition's new image.
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .getAnimations()
          .some(
            (a) =>
              (a.effect as KeyframeEffect | null)?.pseudoElement === '::view-transition-new(root)',
          ),
      ),
    )
    .toBe(true);
  await expect(html).not.toHaveAttribute('data-ink');
});

test('with reduced motion the theme switches at once', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/');
  await toggle(page).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).not.toHaveAttribute('data-ink');
  const inkAnimations = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) =>
          (a.effect as KeyframeEffect | null)?.pseudoElement?.includes('view-transition'),
        ).length,
  );
  expect(inkAnimations).toBe(0);
});
