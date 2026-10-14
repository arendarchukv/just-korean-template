import { expect, test, type Page } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'notice behaviour is checked on desktop');
});

const strip = (page: Page) => page.getByRole('region', { name: /notice/i });

test('shows notices active today and hides expired ones', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-20T10:00:00'));
  await page.goto('/');
  // Spain timetable ended on 2026-12-18; the winter break runs to 2027-01-01.
  await expect(strip(page).getByText('Winter break')).toBeVisible();
  await expect(strip(page).getByText('Spain timetable')).toBeHidden();
});

test('the last day of a notice still shows it', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-18T23:00:00'));
  await page.goto('/');
  await expect(strip(page).getByText('Spain timetable')).toBeVisible();
});

test('a dismissed notice stays hidden after reload and frees its place', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00'));
  await page.goto('/');
  // Four notices are active; three show at once (important, then news), info waits.
  await expect(strip(page).getByText('Spain timetable')).toBeHidden();
  const item = strip(page).getByRole('listitem').filter({ hasText: 'New website' });
  await item.getByRole('button', { name: /dismiss/i }).click();
  await expect(item).toBeHidden();
  await page.reload();
  await expect(strip(page).getByText('New website')).toBeHidden();
  await expect(strip(page).getByText('Spain timetable')).toBeVisible();
});

test('a pinned notice has no dismiss button and always shows during its dates', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00'));
  await page.goto('/');
  const pinned = strip(page).getByRole('listitem').filter({ hasText: 'Winter break' });
  await expect(pinned).toBeVisible();
  await expect(pinned.getByRole('button', { name: /dismiss/i })).toHaveCount(0);
});

test('every visible notice row has the same height, pinned or not', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00'));
  await page.goto('/');
  const heights = await strip(page)
    .locator('[data-notice]:not([hidden])')
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
  expect(heights.length).toBe(3);
  expect(new Set(heights).size, heights.join(', ')).toBe(1);
});

test('each notice says its type in words, not only in colour', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T10:00:00'));
  await page.goto('/');
  const rows = strip(page).getByRole('listitem');
  await expect(rows.filter({ hasText: 'Winter break' })).toContainText('Important');
  await expect(rows.filter({ hasText: 'New website' })).toContainText('New');
  await expect(rows.filter({ hasText: 'Winter break' })).toHaveAttribute('data-tone', 'important');
  await expect(rows.filter({ hasText: 'New website' })).toHaveAttribute('data-tone', 'news');
});

test('without JavaScript, exactly the notices active at build time show', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  // The site was built moments ago, so "today" for the build is the real today.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const items = await page.locator('[data-notice]').evaluateAll((els) =>
    (els as HTMLElement[]).map((el) => ({
      from: el.dataset.from!,
      to: el.dataset.to!,
      hidden: el.hidden,
    })),
  );
  expect(items.length).toBeGreaterThan(0);
  let shown = 0;
  for (const item of items) {
    const active = item.from <= today && today <= item.to && shown < 3;
    if (active) shown += 1;
    expect(item.hidden, JSON.stringify(item)).toBe(!active);
  }
  await context.close();
});
