# Just Korean

Static learning companion site for the **Just Korean (그냥 한국어)** YouTube channel.
The channel teaches, the site helps you learn.

Project decisions and conventions: see [CLAUDE.md](CLAUDE.md).

## Stack

Astro 7 (static output) · Tailwind CSS v4 · Svelte 5 islands · TypeScript (strict) ·
deployed to Cloudflare Workers static assets.

## Requirements

- Node.js 22.12 or newer (see `.nvmrc`)
- npm

## Commands

| Command                | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `npm install`          | Install dependencies                                 |
| `npm run dev`          | Dev server at `http://localhost:4321`                |
| `npm run build`        | Build the static site into `dist/`                   |
| `npm run preview`      | Serve the built site locally                         |
| `npm run check`        | Type-check `.astro`, `.ts` and `.svelte` files       |
| `npm run format`       | Format all files with Prettier                       |
| `npm test`             | Unit tests (Vitest): contrast, tokens, CSS rules     |
| `npm run test:browser` | Accessibility (axe) and print checks in Chrome       |
| `npm run check:dist`   | Checks the built HTML in `dist/` (after build)       |
| `npm run icons`        | Render PNG icons and share image into `public/`      |
| `npm run cf:preview`   | Build and serve via Wrangler, as on Cloudflare       |
| `npm run deploy`       | Build and deploy to Cloudflare Workers (needs login) |

## Project structure

```
public/            static files copied as-is (favicon.svg)
src/
  components/      Header, Footer, Logo, ThemeToggle, LanguageSwitcher
  i18n/            ui.ts (UI dictionary, EN + KO) and utils.ts (helpers)
  layouts/         BaseLayout.astro (head, SEO, hreflang, header, footer)
  pages/           routes: English at /, Korean under /ko/
  styles/          global.css (Tailwind import and design tokens)
  views/           page bodies shared by the EN and KO routes
  config.ts        site name and social links
```

## i18n

English is the default locale (`/`), Korean is under `/ko/`. All UI strings live in
`src/i18n/ui.ts`; missing Korean keys fall back to English. Korean strings marked
`TODO(ko-review)` are drafts that still need review.

To add a page in both languages, create the body in `src/views/` and add thin route
files in `src/pages/` and `src/pages/ko/`.

## Design tokens

Defined in `src/styles/global.css`. The brand scale (`brand-50`…`brand-950`) is derived from
`#5C7EBE` and can be swapped in one place. Components use only semantic tokens
(`bg-bg`, `bg-surface`, `text-text`, `text-muted`, `border-border`, `text-brand`,
`bg-brand-strong`, `bg-accent`…), which are redefined for the dark theme.

## Deploy (Cloudflare)

The domain is not decided yet: `site` in `astro.config.mjs` is a placeholder.

1. `npx wrangler login` (once)
2. `npm run deploy`

Large files (PDF, MP3) will be stored in Cloudflare R2 and linked by URL.
