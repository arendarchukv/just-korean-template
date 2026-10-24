import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Every page template, in both languages where it exists. */
const PAGES = [
  '/',
  '/ko/',
  '/lessons/',
  '/ko/lessons/',
  '/grammar/',
  '/practice/deck/winter-snacks/',
  '/practice/flashcards/',
  '/practice/quizzes/',
  '/ko/practice/flashcards/',
  '/practice/quiz/particles-check/',
  '/practice/',
  '/practice/deck/crash-course-04-negation/',
  '/ko/practice/deck/crash-course-04-negation/',
  '/ko/grammar/',
  '/ko/materials/',
  '/ko/classes/',
  '/practice/quiz/ge-vs-dorok/',
  '/ko/practice/quiz/ge-vs-dorok/',
  '/ko/practice/',
  '/materials/',
  '/classes/',
  '/contact/',
  '/ko/contact/',
  '/lessons/ge-vs-dorok/',
  '/ko/lessons/ge-vs-dorok/',
  '/lessons/crash-course-08-numbers/',
  '/styleguide/',
  '/missing-page/',
  '/ko/missing-page/',
  // The other languages: their home, a content page, a studio and their 404.
  '/es/',
  '/es/classes/',
  '/es/practice/flashcards/',
  '/id/',
  '/id/materials/',
  '/id/lessons/ge-vs-dorok/',
  '/uk/',
  '/uk/practice/quizzes/',
  '/uk/missing-page/',
];

const THEMES = ['light', 'dark'] as const;

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      // A saved choice is what ThemeScript reads before first paint.
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    });

    // The home page with each holiday shown (needs `holiday` other than none in site.yml).
    for (const holiday of ['seollal', 'chuseok', 'christmas', 'hangeulnal', 'gwangbokjeol']) {
      test(`/ with ${holiday} has no WCAG 2.1 A/AA violations`, async ({ page }) => {
        await page.addInitScript((h) => sessionStorage.setItem('holiday-preview', h), holiday);
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('data-holiday', holiday);
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
        ).toEqual([]);
      });
    }

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
