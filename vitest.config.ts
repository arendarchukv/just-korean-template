import { defineConfig } from 'vitest/config';

// Unit tests only. Browser accessibility tests in tests/a11y run with Playwright (`npm run test:a11y`).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
