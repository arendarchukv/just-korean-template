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
  await nav.locator('label', { hasText: 'From lessons' }).click();
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

test.describe('deck list scales: search and segments', () => {
  test('search narrows the list by deck title or by a word inside', async ({ page }) => {
    await page.goto('/practice/deck/cafe/');
    const nav = page.getByRole('navigation', { name: 'Choose a deck' });
    const search = nav.getByRole('searchbox', { name: 'Search decks or words' });
    await search.fill('family');
    await expect(nav.getByRole('link', { name: /Family words/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /At a café/ })).toBeHidden();
    // A Korean word from inside a deck finds that deck.
    await search.fill('붕어빵');
    await expect(nav.getByRole('link', { name: /Winter snacks/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Family words/ })).toBeHidden();
    await search.fill('zzzz');
    await expect(nav.getByText('Nothing found.')).toBeVisible();
  });

  test('segments show the decks on their own or those from lessons, the open one first', async ({
    page,
  }) => {
    await page.goto('/practice/deck/cafe/');
    const nav = page.getByRole('navigation', { name: 'Choose a deck' });
    const fromLessons = nav.getByRole('radio', { name: /From lessons/ });
    await expect(nav.getByRole('radio', { name: /By topic/ })).toBeChecked();
    await expect(nav.getByRole('link', { name: /Negative Form/ })).toBeHidden();
    await nav.locator('label', { hasText: 'From lessons' }).click();
    await expect(fromLessons).toBeChecked();
    await expect(nav.getByRole('link', { name: /Negative Form/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /At a café/ })).toBeHidden();
    // A deck from a lesson opens with its own segment selected.
    await page.goto('/practice/deck/negative-form/');
    await expect(
      page
        .getByRole('navigation', { name: 'Choose a deck' })
        .getByRole('radio', { name: /From lessons/ }),
    ).toBeChecked();
  });

  test('without JavaScript every deck is listed and there is no search', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/practice/deck/cafe/');
    const nav = page.getByRole('navigation', { name: 'Choose a deck' });
    await expect(nav.getByRole('searchbox')).toHaveCount(0);
    await expect(nav.getByRole('link', { name: /Negative Form/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /At a café/ })).toBeVisible();
    await context.close();
  });
});

test.describe('flashcards toolbar', () => {
  test('counts what is left, shuffles, and answers with keys 1 and 2', async ({ page }) => {
    await page.goto('/practice/deck/cafe/');
    await hydrated(page);
    await expect(page.getByText('7 to learn')).toBeVisible();
    await expect(page.locator('.flashcards progress')).toHaveAttribute('max', '7');
    await page.getByRole('button', { name: 'Shuffle' }).click();
    await expect(page.getByText('Card 1 of 7')).toBeVisible();
    await page.keyboard.press('2');
    await expect(page.getByText('6 to learn')).toBeVisible();
    await expect(page.getByText('1 known')).toBeVisible();
    await page.keyboard.press('1');
    await expect(page.getByText('Card 3 of 7')).toBeVisible();
  });

  test('Space turns the card over when focus is not on a field', async ({ page }) => {
    await page.goto('/practice/deck/cafe/');
    await hydrated(page);
    await page.locator('h1').click();
    await page.keyboard.press('Space');
    await expect(page.locator('.flashcard')).toHaveAttribute('data-flipped', 'true');
  });

  test('typing in the deck search does not answer or flip cards', async ({ page }) => {
    await page.goto('/practice/deck/cafe/');
    await hydrated(page);
    await page.getByRole('searchbox', { name: 'Search decks or words' }).fill('12 ');
    await expect(page.getByText('Card 1 of 7')).toBeVisible();
    await expect(page.locator('.flashcard')).toHaveAttribute('data-flipped', 'false');
  });
});
