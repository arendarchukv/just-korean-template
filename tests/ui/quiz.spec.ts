import { expect, test, type Page } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'widgets are checked on desktop');
});

const QUIZ = '/practice/quiz/ge-vs-dorok/';

async function open(page: Page) {
  await page.goto(QUIZ);
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', /.*/);
}

test('a wrong choice is marked, the right one shown, with the explanation', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '려고' }).click();
  await expect(page.getByRole('button', { name: /려고/ })).toHaveAttribute('data-state', 'wrong');
  await expect(page.getByRole('button', { name: /도록/ })).toHaveAttribute('data-state', 'correct');
  await expect(page.getByText('-도록 states the purpose')).toBeVisible();
  // Locked after answering.
  await expect(page.getByRole('button', { name: /도록/ })).toBeDisabled();
});

test('a typed answer accepts an alternative, then the score and best score are kept', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: '도록' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: /answer/i }).fill(' 도록 ');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Correct')).toBeVisible();
  await page.getByRole('button', { name: /see the result/i }).click();
  await expect(page.getByRole('status')).toContainText('2 of 2 correct');

  await page.reload();
  await expect(page.locator('astro-island')).not.toHaveAttribute('ssr', /.*/);
  await expect(page.getByText(/best score: 2 of 2/i)).toBeVisible();
});

test('"Try again" starts from the first question', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '려고' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: /answer/i }).fill('x');
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: /see the result/i }).click();
  await expect(page.getByRole('status')).toContainText('0 of 2 correct');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('button', { name: '려고' })).toBeEnabled();
});
