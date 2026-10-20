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

// Lessons, decks and quizzes: their content is English in every language (see sitemap below).
const ENGLISH_CONTENT = '(lessons|practice/deck|practice/quiz)/[^/]+/';

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

/**
 * The design-system styleguide is a developer page, not part of the site: it is added at
 * /styleguide/ in `astro dev` and in the test build (`npm run build:test` sets JK_STYLEGUIDE, so
 * the browser tests and check:dist can check it), never in the production build.
 * @returns {import('astro').AstroIntegration}
 */
function styleguide() {
  return {
    name: 'styleguide',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev' && !process.env.JK_STYLEGUIDE) return;
        injectRoute({
          pattern: '/styleguide',
          entrypoint: fileURLToPath(new URL('./src/dev/styleguide.astro', import.meta.url)),
        });
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
      // Pages that repeat another (BaseLayout `canonicalPath`) are left out: a lesson, deck or quiz in
      // another language (its content is English) and the studios opened on their first deck/quiz.
      filter: (page) => {
        const path = new URL(page).pathname;
        return !(
          /^\/styleguide\//.test(path) ||
          new RegExp(`^/(${PREFIXED_LANGS.join('|')})/${ENGLISH_CONTENT}`).test(path) ||
          /^\/([a-z]{2}\/)?practice\/(flashcards|quizzes)\/$/.test(path)
        );
      },
      // English-only content has no language alternates.
      serialize: (item) =>
        new RegExp(`^/${ENGLISH_CONTENT}`).test(new URL(item.url).pathname)
          ? { ...item, links: undefined }
          : item,
      i18n: {
        defaultLocale: defaultLang,
        locales: Object.fromEntries(LANGS.map((l) => [l, l])),
      },
    }),
    localized404(),
    styleguide(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
