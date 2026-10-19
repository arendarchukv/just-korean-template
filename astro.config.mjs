// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { headingAnchorsPlugin } from './src/lib/heading-anchors-plugin.ts';
import { wrapTablesPlugin } from './src/lib/wrap-tables-plugin.ts';

import { rename, rmdir } from 'node:fs/promises';
import { LANGS, PREFIXED_LANGS, defaultLang } from './src/i18n/locales.ts';
import { fileURLToPath } from 'node:url';

// Placeholder until the domain is chosen (TBD). Pages read it as Astro.site.
const SITE_URL = 'https://just-korean.example';

/**
 * Astro only emits the root 404 as `404.html`; other locales get `<lang>/404/index.html`.
 * Cloudflare's `not_found_handling: "404-page"` serves the nearest `404.html`, so move it.
 * @returns {import('astro').AstroIntegration}
 */
function localized404() {
  return {
    name: 'localized-404',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        for (const lang of PREFIXED_LANGS) {
          const dirPath = fileURLToPath(new URL(`${lang}/404/`, dir));
          await rename(`${dirPath}index.html`, fileURLToPath(new URL(`${lang}/404.html`, dir)));
          await rmdir(dirPath);
        }
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
    locales: LANGS,
    defaultLocale: defaultLang,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  image: {
    // YouTube thumbnails are fetched at build and served as local WebP. Add the R2 domain here
    // once it is known, so her photo is optimised the same way.
    domains: ['i.ytimg.com'],
    // Every image gets a srcset (widths up to twice its displayed size), Markdown images in lesson
    // texts included, so a phone downloads a small file. The components style their images
    // themselves, so Astro's global responsive styles stay off.
    layout: 'constrained',
    responsiveStyles: false,
    // Fewer steps than Astro's default list, each about 1.5× the one before. Remote images (YouTube
    // thumbnails) set their own widths, since Astro cannot see how large they are.
    breakpoints: [320, 480, 640, 960, 1280, 1920],
  },
  markdown: {
    // Code is styled by .prose with semantic tokens; Shiki would inject its own colours.
    syntaxHighlight: false,
    processor: satteri({ hastPlugins: [wrapTablesPlugin, headingAnchorsPlugin] }),
  },
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => !/^\/(styleguide|guide)\//.test(new URL(page).pathname),
      i18n: {
        defaultLocale: defaultLang,
        locales: Object.fromEntries(LANGS.map((l) => [l, l])),
      },
    }),
    localized404(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
