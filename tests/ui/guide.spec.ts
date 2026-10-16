import { expect, test } from '@playwright/test';

// DEMO ONLY page: the site guide, reached from the footer, with the design system as a second tab.
test('the footer leads to the site guide, whose tabs switch to the design system', async ({
  page,
}) => {
  await page.goto('/uk/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Довідник сайту' }).click();
  await expect(page).toHaveURL(/\/guide\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What you can add');
  await expect(page.getByRole('heading', { level: 2, name: 'Lessons', exact: true })).toBeVisible();

  const tabs = page.getByRole('navigation', { name: 'Site guide' });
  await expect(tabs.getByRole('link', { name: 'What you can add' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await tabs.getByRole('link', { name: 'Design system' }).click();
  await expect(page).toHaveURL(/\/styleguide\/$/);
  await expect(
    page
      .getByRole('navigation', { name: 'Site guide' })
      .getByRole('link', { name: 'Design system' }),
  ).toHaveAttribute('aria-current', 'page');
});
