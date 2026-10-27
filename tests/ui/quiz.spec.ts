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

test('focus moves to Next after answering, then to the next question, and feedback is announced', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: '도록' }).click();
  await expect(page.locator('[aria-live="polite"]').first()).toContainText('Correct');
  await expect(page.getByRole('button', { name: 'Next' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: /answer/i })).toBeFocused();
});

test('an empty answer is ignored, and a broken stored best score is not shown', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('jk:quiz:ge-vs-dorok', '"abc"'));
  await open(page);
  await expect(page.getByText(/best score/i)).toHaveCount(0);
  await page.getByRole('button', { name: '도록' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText(/^(Correct|Not quite)$/)).toHaveCount(0);
});

test('steps colour each answer, and the result shows the score, counts and a review', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: '려고' }).click();
  await expect(page.locator('.quiz-steps li').first()).toHaveAttribute('data-state', 'wrong');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('.quiz-steps li').nth(1)).toHaveAttribute('data-state', 'current');
  await page.getByRole('textbox', { name: /answer/i }).fill('게');
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: /see the result/i }).click();

  await expect(page.locator('.quiz-score-num')).toHaveText('1/2');
  await expect(page.getByText('Good start')).toBeVisible();
  await expect(page.getByText('1 correct')).toBeVisible();
  await expect(page.getByText('1 wrong')).toBeVisible();
  const review = page.getByRole('region', { name: 'Your answers' });
  await expect(review.getByRole('listitem')).toHaveCount(2);
  const first = review.getByRole('listitem').first();
  await expect(first).toHaveAttribute('data-correct', 'false');
  await expect(first).toContainText('You answered: 려고');
  await expect(first).toContainText('Answer: 도록');
  await expect(first).toContainText('-도록 states the purpose');
  await expect(review.getByRole('listitem').nth(1)).toHaveAttribute('data-correct', 'true');
  // The review marks are the same drawn icons as the options, not text glyphs.
  await expect(review.locator('.quiz-review-mark svg')).toHaveCount(2);
  await expect(review.locator('.quiz-review-mark')).toHaveText(['', '']);
});

test('a perfect result gets the round 칭찬 도장 참 잘했어요; a low one gets none', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '도록' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: /answer/i }).fill('도록');
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: /see the result/i }).click();
  const seal = page.locator('.quiz-stamp');
  await expect(seal).toHaveAttribute('data-stamp', 'perfect');
  await expect(seal).toHaveAttribute('aria-hidden', 'true');
  await expect(seal).toContainText('참잘했어요');

  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: '려고' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: /answer/i }).fill('x');
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: /see the result/i }).click();
  await expect(page.getByRole('status')).toContainText('0 of 2 correct');
  await expect(seal).toHaveCount(0);
});
