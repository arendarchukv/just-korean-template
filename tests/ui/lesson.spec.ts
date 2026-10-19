import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Never load YouTube in tests; the iframe element is what we check.
  await page.route(/youtube(-nocookie)?\.com/, (route) => route.abort());
});

test('clicking play swaps the thumbnail for a privacy-friendly player and moves focus to it', async ({
  page,
}) => {
  await page.goto('/lessons/ge-vs-dorok/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('link', { name: /play video/i }).click();
  const frame = page.locator('[data-video-facade] iframe');
  await expect(frame).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/R3Ny_hDzKpc/);
  await expect(frame).toBeFocused();
});

test('without JavaScript the play button is a link to YouTube', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/lessons/ge-vs-dorok/');
  await expect(page.getByRole('link', { name: /play video/i })).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=R3Ny_hDzKpc',
  );
  await context.close();
});

test('a course lesson links to its neighbours', async ({ page }) => {
  await page.goto('/lessons/crash-course-04-negation/');
  await expect(page.getByRole('link', { name: /next/i })).toHaveAttribute(
    'href',
    '/lessons/crash-course-05-tenses/',
  );
});

test('the play button shows a focus ring that is not clipped by the frame', async ({ page }) => {
  await page.goto('/lessons/ge-vs-dorok/');
  const link = page.getByRole('link', { name: /play video/i });
  await link.focus();
  const clipped = await link.evaluate((el) => {
    const frame = el.closest('[data-video-facade]')!;
    const offset = parseFloat(getComputedStyle(el).outlineOffset);
    return getComputedStyle(frame).overflow === 'hidden' && offset >= 0;
  });
  expect(clipped).toBe(false);
});

test('Ctrl+click on play opens YouTube normally instead of the embedded player', async ({
  page,
}) => {
  await page.goto('/lessons/ge-vs-dorok/');
  const link = page.getByRole('link', { name: /play video/i });
  const swapped = await link.evaluate((el) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    el.dispatchEvent(event);
    return document.querySelector('[data-video-facade] iframe') !== null;
  });
  expect(swapped).toBe(false);
});

test('a lesson with its own words links to their flashcards page, named after the lesson', async ({
  page,
}) => {
  await page.goto('/lessons/crash-course-04-negation/');
  await page.getByRole('link', { name: /flashcards/i }).click();
  await expect(page).toHaveURL(/\/practice\/deck\/crash-course-04-negation\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Negative Form');
  await expect(
    page.getByRole('link', {
      name: 'Beginner Korean Intensive Course! 4. Negative Form',
      exact: true,
    }),
  ).toHaveAttribute('href', '/lessons/crash-course-04-negation/');
});

test('a long playlist scrolls inside its box, with the open lesson in view', async ({ page }) => {
  test.skip(
    test.info().project.name !== 'desktop',
    'the side list sits beside the lesson on desktop',
  );
  await page.goto('/lessons/geodeunyo-vs-janhayo/');
  const result = await page.locator('.series-list').evaluate((list) => {
    const current = list.querySelector('[aria-current="page"]')!.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    return {
      scrolls: list.scrollHeight > list.clientHeight,
      inView: current.top >= box.top && current.bottom <= box.bottom,
      page: window.scrollY,
    };
  });
  expect(result).toEqual({ scrolls: true, inView: true, page: 0 });
});

test('the lesson head: title, level, date and a link to the video on YouTube', async ({ page }) => {
  await page.goto('/lessons/ge-vs-dorok/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Korean Grammar 한국어 문법 : 게 vs 도록',
  );
  const meta = page.locator('[data-lesson-meta]');
  await expect(meta.locator('.badge-level')).toBeVisible();
  await expect(meta.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
  await expect(meta.getByRole('link', { name: /Watch on YouTube/ })).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=R3Ny_hDzKpc',
  );
});

test('a course lesson says where it sits in the course', async ({ page }) => {
  await page.goto('/lessons/crash-course-04-negation/');
  await expect(page.locator('.lesson-head')).toContainText('Lesson 4 of 10');
});

test('the playlist panel marks the open lesson and says how many lessons it has', async ({
  page,
}) => {
  await page.goto('/lessons/ge-vs-dorok/');
  const aside = page.locator('.lesson-aside');
  await expect(aside).toContainText('52 lessons');
  await expect(aside.locator('[aria-current="page"]')).toHaveText(
    'Korean Grammar 한국어 문법 : 게 vs 도록',
  );
});

test('the Grammar page marks Free lessons as the current section', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'the full menu shows on desktop');
  await page.goto('/grammar/');
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Free lessons' }),
  ).toHaveAttribute('aria-current', 'page');
});

test.describe('a reading lesson without a video', () => {
  const url = '/lessons/dangun-bear-and-tiger/';

  test('opens with its cover picture instead of a player', async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('[data-video-facade]')).toHaveCount(0);
    const cover = page.locator('.lesson-cover img');
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute('src', /\.webp$/);
    // The share image is the cover too.
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/_astro\/.+\.jpg$/,
    );
  });

  test('reads in Korean, part by part, with the translation folded away', async ({ page }) => {
    await page.goto(url);
    const reading = page.getByRole('region', { name: /읽기/ });
    await expect(reading.getByRole('heading', { level: 2 })).toHaveText('읽기 Reading');
    await expect(reading.locator('.story-part')).toHaveCount(4);
    const first = reading.locator('.story-part').first();
    await expect(first.locator('.story-text')).toHaveAttribute('lang', 'ko');
    const translation = first.locator('.story-translation-text');
    await expect(translation).toBeHidden();
    await first.getByText('Translation').click();
    await expect(translation).toBeVisible();
  });

  test('lists its words on the page', async ({ page }) => {
    await page.goto(url);
    const words = page.getByRole('region', { name: /단어/ });
    await expect(words.locator('dt', { hasText: '곰' })).toBeVisible();
    await expect(words.locator('dd').first()).not.toBeEmpty();
  });

  test('shows its cover on its card in the library', async ({ page }) => {
    await page.goto('/lessons/?q=단군');
    const card = page.locator('[data-lessons-grid] li:visible').first();
    await expect(card.locator('img.lesson-thumb')).toBeVisible();
    await expect(card.locator('.lesson-thumb-empty')).toHaveCount(0);
  });
});
