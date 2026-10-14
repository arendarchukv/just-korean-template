import { expect, test } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the demo form is checked on desktop');
});

test('the demo form checks the fields and says it sent nothing', async ({ page }) => {
  await page.goto('/contact/');
  const send = page.getByRole('button', { name: /send/i });
  await send.click();
  // Browser validation stops an empty form: the demo note is not shown yet.
  await expect(page.getByRole('status')).toHaveText('');

  await page.getByLabel(/name/i).fill('Mina');
  await page.getByLabel(/email/i).fill('mina@example.com');
  await page.getByLabel(/topic/i).selectOption({ index: 1 });
  await page.getByLabel(/message/i).fill('Hello! Do you have evening classes?');
  await send.click();

  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.getByRole('status')).toContainText(/demo/i);
});

test('the footer Contact link opens the demo page', async ({ page }) => {
  await page.goto('/');
  await page.locator('footer').getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
});
