import { expect, test } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the contact page is checked on desktop');
});

// Site settings hold her Tally link, so the page shows that form inside it, not the demo form.
test('the contact page shows the Tally form inside the page', async ({ page }) => {
  await page.goto('/contact/');
  // Tally's script gives the frame its address (from data-tally-src) once it is in view.
  const frame = page.locator('iframe[data-tally-src]');
  await expect(frame).toHaveAttribute('src', /^https:\/\/tally\.so\/embed\/\w+\?/);
  await expect(frame).toHaveAttribute('title', 'Contact');
  await expect(page.getByRole('link', { name: /open it in a new tab/i })).toHaveAttribute(
    'href',
    /^https:\/\/tally\.so\/r\//,
  );
  await expect(page.locator('[data-demo-form]')).toHaveCount(0);
});

test('the footer Contact link opens the contact page', async ({ page }) => {
  await page.goto('/');
  await page.locator('footer').getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});
