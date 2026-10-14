import { brotliCompressSync } from 'node:zlib';
import { expect, test } from '@playwright/test';

/*
 * Performance budget on a throttled mid-range phone (4x slower CPU, slow 4G). Measured against
 * the local build, so it guards what our code controls; real-network numbers (compression,
 * caching, CDN) come from PageSpeed Insights once the site is hosted.
 * Baseline 2026-10-12: LCP 0.84–1.21 s, CLS 0–0.036, CSS 17 KB brotli, no external JS.
 * 2026-10-14 (new home): LCP 0.92 s, CSS 18.5 KB, fonts ~243 KB on the English home (Outfit 32,
 * serif display slices 57, Pretendard slices for Korean lesson titles 154).
 */
const BUDGET = {
  lcpMs: 2000,
  cls: 0.1,
  cssBrotliBytes: 25_000,
  renderBlocking: 1,
  scripts: 0,
  /** Widget pages (flashcards, quiz) may load JS, but only a little. */
  widgetJsBrotliBytes: 30_000,
  fontKBOnEnglishHome: 300,
};

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'budget is measured on the mobile profile');
});

type Measured = {
  lcp: number;
  cls: number;
  blocking: string[];
  css: number;
  scripts: number;
  jsBrotli: number;
  fontBytes: number;
};

async function measure(page: import('@playwright/test').Page, path: string): Promise<Measured> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  let css = 0;
  let scripts = 0;
  let jsBrotli = 0;
  let fontBytes = 0;
  page.on('response', async (response) => {
    const type = response.request().resourceType();
    if (type === 'script') {
      scripts += 1;
      jsBrotli += brotliCompressSync(await response.body()).length;
    }
    if (type === 'font') fontBytes += (await response.body()).length;
    if (type === 'stylesheet') css += brotliCompressSync(await response.body()).length;
  });

  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number; __lcp: number };
    w.__cls = 0;
    w.__lcp = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (!e.hadRecentInput) w.__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      w.__lcp = list.getEntries().at(-1)!.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  await page.goto(path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const metrics = await page.evaluate(() => {
    const w = window as unknown as { __cls: number; __lcp: number };
    return {
      lcp: w.__lcp,
      cls: w.__cls,
      blocking: performance
        .getEntriesByType('resource')
        .filter(
          (r) =>
            (r as PerformanceResourceTiming & { renderBlockingStatus?: string })
              .renderBlockingStatus === 'blocking',
        )
        .map((r) => r.name),
    };
  });
  return { ...metrics, css, scripts, jsBrotli, fontBytes };
}

const WIDGET_PAGES = ['/practice/deck/negative-form/'];

for (const path of ['/', '/ko/', '/styleguide/', '/lessons/ge-vs-dorok/', ...WIDGET_PAGES]) {
  test(`${path} stays within the performance budget`, async ({ page }) => {
    const m = await measure(page, path);
    const report = JSON.stringify(m);
    expect(m.lcp, report).toBeLessThan(BUDGET.lcpMs);
    expect(m.cls, report).toBeLessThan(BUDGET.cls);
    expect(m.blocking.length, report).toBeLessThanOrEqual(BUDGET.renderBlocking);
    expect(m.css, report).toBeLessThan(BUDGET.cssBrotliBytes);
    if (WIDGET_PAGES.includes(path)) {
      expect(m.jsBrotli, report).toBeLessThan(BUDGET.widgetJsBrotliBytes);
    } else {
      expect(m.scripts, report).toBe(BUDGET.scripts);
    }
    if (path === '/') {
      expect(m.fontBytes / 1024, report).toBeLessThanOrEqual(BUDGET.fontKBOnEnglishHome);
    }
  });
}
