// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { wrapTablesPlugin } from './src/lib/wrap-tables-plugin.ts';

import { rename, rmdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Placeholder until the domain is chosen (TBD). Pages read it as Astro.site.
const SITE_URL = 'https://just-korean.example';

/**
 * Astro only emits the root 404 as `404.html`; other locales get `ko/404/index.html`.
 * Cloudflare's `not_found_handling: "404-page"` serves the nearest `404.html`, so move it.
 * @returns {import('astro').AstroIntegration}
 */
function localized404() {
  return {
    name: 'localized-404',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const dirPath = fileURLToPath(new URL('ko/404/', dir));
        await rename(`${dirPath}index.html`, fileURLToPath(new URL('ko/404.html', dir)));
        await rmdir(dirPath);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',
  i18n: {
    locales: ['en', 'ko'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    // Code is styled by .prose with semantic tokens; Shiki would inject its own colours.
    syntaxHighlight: false,
    processor: satteri({ hastPlugins: [wrapTablesPlugin] }),
  },
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/styleguide'),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', ko: 'ko' },
      },
    }),
    localized404(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
