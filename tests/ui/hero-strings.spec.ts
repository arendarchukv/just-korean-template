import { expect, test, type Page } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'a mouse crosses the strings on desktop');
});

// Move the mouse down through the strip, as a finger would brush the strings.
async function brush(page: Page) {
  const strip = page.locator('[data-hero-strings]');
  // The mouse reaches only what is on screen.
  await strip.scrollIntoViewIfNeeded();
  const box = (await strip.boundingBox())!;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y - 10);
  await page.mouse.move(x, box.y + box.height + 10, { steps: 6 });
}

test('the hero rule is three strings that ring when a pointer crosses them', async ({ page }) => {
  await page.goto('/');
  const strings = page.locator('[data-hero-strings] [data-string]');
  await expect(strings).toHaveCount(3);
  await expect(page.locator('[data-hero-strings]')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('[data-hero-strings] [data-ringing]')).toHaveCount(0);

  await brush(page);
  await expect(page.locator('[data-hero-strings] [data-ringing]')).toHaveCount(3);
  // They come to rest again: the still line is back.
  await expect(page.locator('[data-hero-strings] [data-ringing]')).toHaveCount(0, {
    timeout: 5000,
  });
});

test('with reduced motion the strings stay still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await brush(page);
  await page.waitForTimeout(200);
  await expect(page.locator('[data-hero-strings] [data-ringing]')).toHaveCount(0);
});
