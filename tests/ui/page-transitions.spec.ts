import { expect, test, type Page } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'page transitions are checked on desktop');
});

/** Records, on every page load, whether the browser revealed it with a view transition. */
async function recordReveal(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener('pagereveal', (event) => {
      (window as unknown as { __viewTransition: boolean }).__viewTransition = Boolean(
        (event as Event & { viewTransition?: unknown }).viewTransition,
      );
    });
  });
}

/** `pagereveal` fires at the first render after the URL changes, so wait for it. */
async function revealedWithTransition(page: Page) {
  // Wrapped in an object: waitForFunction waits for a truthy result, and `false` is an answer.
  const handle = await page.waitForFunction(() => {
    const value = (window as unknown as { __viewTransition?: boolean }).__viewTransition;
    return value === undefined ? null : { value };
  });
  return (await handle.jsonValue())!.value;
}

test('navigating between pages uses a cross-document view transition', async ({ page }) => {
  await recordReveal(page);
  await page.goto('/lessons/');
  await page.locator('header nav').getByRole('link', { name: 'Classes' }).click();
  await page.waitForURL('**/classes/');
  expect(await revealedWithTransition(page)).toBe(true);
});

test('the header keeps its place during the transition', async ({ page }) => {
  await page.goto('/');
  expect(
    await page.locator('header').evaluate((el) => getComputedStyle(el).viewTransitionName),
  ).toBe('site-header');
});

test('no transition when the visitor prefers reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await recordReveal(page);
  await page.goto('/lessons/');
  await page.locator('header nav').getByRole('link', { name: 'Classes' }).click();
  await page.waitForURL('**/classes/');
  expect(await revealedWithTransition(page)).toBe(false);
});
