import { defineConfig, devices } from '@playwright/test';

// Accessibility checks against the built site (`npm run test:a11y` builds first).
// Uses the locally installed Google Chrome, so no browser download is needed.
const PORT = 4329;

export default defineConfig({
  testDir: 'tests/a11y',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
  webServer: {
    command: `npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
