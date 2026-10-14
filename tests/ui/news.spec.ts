import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const FEED = /rss\.ohmynews\.com/;
const fixture = readFileSync('src/lib/news.fixture.xml', 'utf8');

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'news loading is checked on desktop');
});

test('news previews load in the browser from the RSS feed', async ({ page }) => {
  await page.route(FEED, (route) =>
    route.fulfill({ status: 200, contentType: 'text/xml', body: fixture }),
  );
  await page.goto('/news/');
  const items = page.locator('.news-item');
  await expect(items).toHaveCount(2);
  const first = items.first();
  await expect(first.getByRole('link')).toHaveAttribute(
    'href',
    'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0000000001',
  );
  await expect(first.getByRole('link')).toHaveAttribute('target', '_blank');
  await expect(first).toContainText('문화');
  await expect(first).toContainText('시립 도서관이 한글날을 맞아');
  await expect(page.locator('.news-list img')).toHaveCount(0);
});

test('if the feed cannot be loaded, a calm message links to OhmyNews', async ({ page }) => {
  await page.route(FEED, (route) => route.abort());
  await page.goto('/news/');
  const message = page.locator('[data-news-unavailable]');
  await expect(message).toBeVisible();
  await expect(message.getByRole('link')).toHaveAttribute('href', 'https://www.ohmynews.com/');
});
