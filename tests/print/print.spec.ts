import { expect, test } from '@playwright/test';

// Print rendering is layout-independent of the device; check it once, on desktop.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'print is checked on desktop only');
});

/** Relative luminance of a computed `rgb(...)` colour. */
function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

for (const theme of ['light', 'dark'] as const) {
  test(`prints dark ink on white paper (${theme} theme on screen)`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    await page.goto('/styleguide/');
    await page.emulateMedia({ media: 'print' });

    const [bg, text] = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return [s.backgroundColor, s.color];
    });
    expect(bg).toBe('rgb(255, 255, 255)');
    expect(luminance(text)).toBeLessThan(0.05);
  });
}

test('hides site chrome and decoration, keeps the logo as a letterhead', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('header nav').first()).toBeHidden();
  await expect(page.locator('[data-theme-toggle]')).toBeHidden();
  await expect(page.getByRole('link', { name: '한국어' })).toBeHidden();
  // Desktop button and the one inside the mobile menu.
  for (const button of await page.locator('header .btn-primary').all()) {
    await expect(button).toBeHidden();
  }
  await expect(page.locator('footer nav')).toBeHidden();
  await expect(page.locator('.collage')).toBeHidden();
  await expect(page.locator('header a[aria-label]').first()).toBeVisible();
});

test('hides buttons: they do nothing on paper, and their fill would not print', async ({
  page,
}) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  for (const button of await page.locator('main .btn').all()) {
    await expect(button).toBeHidden();
  }
});

test('gives text the full width where a collage was, and drops empty decoration', async ({
  page,
}) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  const columns = await page
    .locator(':has(> .collage)')
    .first()
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(1);
  const eyebrowMark = await page
    .locator('.eyebrow')
    .first()
    .evaluate((el) => getComputedStyle(el, '::before').display);
  expect(eyebrowMark).toBe('none');
  // The footer prints only its copyright line, not an empty bordered block.
  await expect(page.locator('footer > .container-page').first()).toBeHidden();
  await expect(page.getByText(/© \d{4} Just Korean/)).toBeVisible();
});

test('marks key expressions with an underline (backgrounds are not printed)', async ({ page }) => {
  await page.goto('/styleguide/');
  await page.emulateMedia({ media: 'print' });
  const decoration = await page
    .locator('.key-mark')
    .first()
    .evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(decoration).toContain('underline');
});

test('prints the content of closed <details>', async ({ page }) => {
  await page.goto('/styleguide/');
  await page.emulateMedia({ media: 'print' });
  const details = page.locator('.prose details');
  await expect(details).not.toHaveAttribute('open', /.*/);
  await expect(details.locator('p').first()).toBeVisible();
});

test('shows the address after external links in long-form text', async ({ page }) => {
  await page.goto('/styleguide/');
  await page.emulateMedia({ media: 'print' });
  const after = await page
    .locator('.prose a[href^="https://"]')
    .first()
    .evaluate((el) => getComputedStyle(el, '::after').content);
  expect(after).toContain('stdict.korean.go.kr');
});

test('keeps tables, quotes and examples in one piece across pages', async ({ page }) => {
  await page.goto('/styleguide/');
  await page.emulateMedia({ media: 'print' });
  for (const selector of ['.prose table', '.prose blockquote', '.pair', '.callout']) {
    const breakInside = await page
      .locator(selector)
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside);
    expect(breakInside, selector).toBe('avoid');
  }
});
