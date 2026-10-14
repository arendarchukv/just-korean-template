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

test('a dismissed notice stays hidden after reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T10:00:00'));
  await page.goto('/');
  const item = strip(page).getByRole('listitem').filter({ hasText: 'Winter break' });
  await item.getByRole('button', { name: /dismiss/i }).click();
  await expect(item).toBeHidden();
  await page.reload();
  await expect(strip(page).getByText('Winter break')).toBeHidden();
  await expect(strip(page).getByText('Spain timetable')).toBeVisible();
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
    const active = item.from <= today && today <= item.to && shown < 2;
    if (active) shown += 1;
    expect(item.hidden, JSON.stringify(item)).toBe(!active);
  }
  await context.close();
});
