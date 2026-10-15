import { expect, test } from '@playwright/test';

const hydrated = async (page: import('@playwright/test').Page) =>
  expect(page.locator('astro-island')).not.toHaveAttribute('ssr', /.*/);

test('Practice leads to the two studios', async ({ page }) => {
  await page.goto('/practice/');
  await page
    .getByRole('link', { name: /Flashcards/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/practice\/flashcards\/$/);
  await page.goto('/practice/');
  await page
    .getByRole('link', { name: /Quizzes/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/practice\/quizzes\/$/);
});

test('the deck list marks the open deck and opens another one', async ({ page }) => {
  await page.goto('/practice/deck/cafe/');
  const nav = page.getByRole('navigation', { name: 'Choose a deck' });
  await expect(nav.locator('[aria-current="page"]')).toContainText('At a café');
  await nav.getByRole('link', { name: /Family words/ }).click();
  await expect(page).toHaveURL(/\/practice\/deck\/family\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Family words');
  await expect(
    page.getByRole('navigation', { name: 'Choose a deck' }).locator('[aria-current="page"]'),
  ).toContainText('Family words');
});

test('decks that come with a lesson are listed apart', async ({ page }) => {
  await page.goto('/practice/flashcards/');
  const nav = page.getByRole('navigation', { name: 'Choose a deck' });
  await expect(nav.getByText('From lessons')).toBeVisible();
  await expect(nav.getByRole('link', { name: /Negative Form/ })).toHaveAttribute(
    'href',
    '/practice/deck/negative-form/',
  );
});

test('the card turns over to its back and back again', async ({ page }) => {
  await page.goto('/practice/deck/cafe/');
  await hydrated(page);
  const card = page.locator('.flashcard');
  const back = page.locator('.flashcard-face-back');
  await card.click();
  await expect(card).toHaveAttribute('data-flipped', 'true');
  await expect(back).toContainText('One Americano, please');
  // The turn has finished: the back now faces the visitor.
  await expect
    .poll(() => card.locator('.flashcard-inner').evaluate((el) => getComputedStyle(el).transform))
    .toMatch(/matrix3d\(-1/);
  await card.click();
  await expect(card).toHaveAttribute('data-flipped', 'false');
});

test('the quiz list works the same way', async ({ page }) => {
  await page.goto('/practice/quizzes/');
  const nav = page.getByRole('navigation', { name: 'Choose a quiz' });
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await nav.getByRole('link', { name: /Which greeting/ }).click();
  await expect(page).toHaveURL(/\/practice\/quiz\/greetings-check\/$/);
});
