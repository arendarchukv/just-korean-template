import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Every page template, in both languages where it exists. */
const PAGES = [
  '/',
  '/ko/',
  '/learn/',
  '/ko/learn/',
  '/materials/',
  '/classes/',
  '/news/',
  '/styleguide/',
  '/missing-page/',
  '/ko/missing-page/',
];

const THEMES = ['light', 'dark'] as const;

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      // A saved choice is what ThemeScript reads before first paint.
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    });

    for (const path of PAGES) {
      test(`${path} has no WCAG 2.1 A/AA violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const report = violations.map(
          (v) =>
            `${v.id} (${v.impact}): ${v.help}\n` +
            v.nodes.map((n) => `  - ${n.target.join(' ')}: ${n.failureSummary}`).join('\n'),
        );
        expect(report, report.join('\n\n')).toEqual([]);
      });
    }
  });
}

test('first Tab reaches the skip link, which moves focus to the main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});
