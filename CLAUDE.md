# Just Korean — project brief for Claude Code

This file records decisions made during planning. Anything marked **TBD** is still being
discussed with the site owner — do not build it yet.

## Status — read this first (updated 2026-10-14)

**Content direction is set:** a lesson-centred library built on her YouTube channel, edited in
Pages CMS. Spec: `docs/superpowers/specs/2026-10-14-content-model-and-home-design.md` (content
model, CMS rules, home page). Built: content collections + `.pages.yml`, real demo content, the
new home page (notice strip, about, classes, 목차, new lessons), placeholder lesson pages.

Next cycles, each with its own spec (from the spec's "Out of scope"): 1. lesson page and series
library, 2. grammar reference, 3. materials page, 4. flashcards, 5. quizzes with Tally results, 6. dictionary search and pronunciation, 7. Korean news reading (RSS). Also later: daily rebuild on
the host, an R2 upload page, content translations.

Done earlier (content-independent):

- Foundation: Astro 7 static, Tailwind v4, strict TS, i18n EN (`/`) + KO (`/ko/`), sitemap,
  theme toggle (light/dark), header/footer, placeholder pages (Learn, Materials, Classes, News,
  About), 404s.
- Design system "Paper & cut-outs" (spec `docs/superpowers/specs/2026-10-11-design-system-design.md`),
  shown on `/styleguide` (dev page, noindex).
- Long-form typography (`.prose`), print styles, app icons + share image (`npm run icons`),
  `robots.txt`, web manifest.
- Polish: mobile menu behaviour, heading anchors, page transitions, finishing details.
- Quality gates: `npm test` (unit), `npm run check`, `npm run build` + `npm run check:dist`,
  `npm run test:browser` (axe a11y, print, UI, performance budget in local Chrome).

Waiting on the owner (do not guess these):

- Her photo, bio wording (`src/content/settings/home.yml`, drafted), TidyCal and Tally URLs,
  the R2 public domain (`site.yml`; add it to `image.domains` in `astro.config.mjs` for the photo).
- Domain (placeholder `https://just-korean.example` in `astro.config.mjs`) and hosting/deploy
  (Cloudflare Workers is planned; no deploy until asked).
- Brand: final colour (#5C7EBE vs #68ACF9), logo variant A/B/C, wordmark font.
- Instagram/Ko-fi links (`src/content/settings/site.yml`), Korean UI strings review (`TODO(ko-review)`), About text.
- Privacy page and analytics (needed once Tally forms or analytics are added).

When resuming: run the quality gates above first; `npx astro dev --background` for the dev
server (restart it after changing Markdown config).

## What this is

A static learning companion site for **Just Korean (그냥 한국어)**, a YouTube channel
by a Korean teacher, JiEun (@JustKorean, ~234 videos). This is an unpaid side project.

**Core idea: the channel teaches, the site helps you learn.** YouTube stays the
core. The site adds what YouTube can't: structure (courses in order, progress),
search (a grammar reference by pattern), practice (key expressions, quizzes,
flashcards), materials attached to each video (PDF, audio), and a path to her
paid classes.

## Stack (versions checked 2026-10-11 — re-verify with `npm view <pkg> version`)

- **Astro 7.x** (7.3.8), fully static output (`output: 'static'`), no SSR adapter
- **Tailwind CSS v4** via `@tailwindcss/vite` (4.3.x), CSS-first config (`@theme`), no `tailwind.config.js`
- **Svelte 5** (`@astrojs/svelte` 9.x) for interactive islands only
- **TypeScript 6.x**, strict. Not 7.x yet: `@astrojs/check` and `@astrojs/svelte` peer-depend on `^5 || ^6`
- `@astrojs/sitemap`, `@astrojs/check`
- Prettier 3 + `prettier-plugin-astro`, `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`
- Node >= 22.12 (Astro 7 engines). Add `.nvmrc`
- Deploy target: **Cloudflare Workers static assets** (`wrangler.jsonc` with `assets.directory: "./dist"`).
  Heavy files (PDF, MP3) will live in **Cloudflare R2** and be linked by URL.
- Content editing later via **Pages CMS** (Git-based); content as Astro content collections.
- Developer is on **Windows**: keep scripts cross-platform (no bash-only npm scripts).

## Phase 1 scope — the foundation only

Build the skeleton, **no feature functionality yet**:

1. Astro project, strict TS, path alias `@/*` → `src/*`
2. Tailwind v4 with design tokens (below), light and dark themes
3. i18n: **English default, Korean second**
   - Astro built-in `i18n`: `locales: ['en','ko']`, `defaultLocale: 'en'`,
     `routing.prefixDefaultLocale: false` → `/` is English, `/ko/` is Korean
   - Typed UI dictionary (`src/i18n/ui.ts`) + `useTranslations(lang)` helper;
     missing Korean keys fall back to English
   - Language switcher that keeps the current page (`getRelativeLocaleUrl`)
   - Correct `<html lang>`, `hreflang` alternates, sitemap with i18n
4. Base layout: `<head>` (SEO meta, OG, favicon), header with nav placeholders
   (Learn · Materials · Classes · News, and a "Book a class" button), footer
   (YouTube, Instagram, Contact, Support on Ko-fi), skip link
5. Theme toggle (light / dark; first visit follows the OS until the visitor chooses) with an
   inline head script so there is no flash
6. Placeholder home page (EN + KO) and a 404 page
7. Logo as an SVG component + `favicon.svg`
8. Fonts self-hosted (no Google Fonts requests): Outfit for Latin
   (`@fontsource-variable/outfit`), Pretendard for Korean (`pretendard`,
   **dynamic-subset** build so Korean glyphs load on demand)
9. `wrangler.jsonc`, `.editorconfig`, `.gitignore`, `README.md`
10. `git init` with an initial commit (local only; the owner adds the remote)

## Design tokens

**Brand color is unresolved (TBD).** The YouTube banner logo is `#5C7EBE`
(muted denim). The old site used `#68ACF9` (sky). Build the scale from the banner
blue by default and keep it as one token so it can be swapped.

Brand scale (derived from #5C7EBE; adjust in OKLCH if needed):

| token     | hex     | use                                     |
| --------- | ------- | --------------------------------------- |
| brand-50  | #F1F4FA | tinted backgrounds                      |
| brand-100 | #E2E8F4 |                                         |
| brand-200 | #C5D1E8 |                                         |
| brand-300 | #9DB0D6 | brand text and accents on dark          |
| brand-400 | #7792C8 |                                         |
| brand-500 | #5C7EBE | **logo**                                |
| brand-600 | #4A68A6 |                                         |
| brand-700 | #3F5F9E | **buttons with white text** (passes AA) |
| brand-800 | #334C7E |                                         |
| brand-900 | #2A3E66 |                                         |
| brand-950 | #1A2740 |                                         |

Rules:

- White text never sits on brand-400/500. Use 700+. Check WCAG AA (4.5:1 body text).
- Neutrals (paper and ink). Light: bg #FBFBFD, paper #EEF0F8, border #DEE2EF,
  ink #1D2340, muted #4A5170. Dark (indigo): bg #111733, surface #1A2246,
  border #2C3763, text #E8EDFB, muted #A3ADCF.
- No warm accent: the system is fully cool. **Teal** (scale from #56A8A3, from the channel
  intro) is the second color, used for learning moments (key-expression marks, "correct",
  progress, focus ring). Muted red only for errors / "wrong". White text never on teal-400/500.
- Design system "Paper & cut-outs": see `docs/superpowers/specs/2026-10-11-design-system-design.md`
  and `/styleguide` (dev reference page, noindex). Signature details: hatch link underline,
  key-expression hatch mark, 원고지 grid paper for examples, cut-paper shapes (collage only in
  hero / 404 / empty states). Tokens: `src/styles/theme.css`; classes: `src/styles/signature.css`.
- `npm test` checks every semantic text/background pair for WCAG AA in both themes.
- Long-form text (Markdown lessons, articles): wrap in `class="prose"` (`src/styles/prose.css`).
  Mark Korean inside English text with `lang="ko"` (font, keep-all wrapping, 방점 instead of
  italics). Sample: `src/components/styleguide/samples/lesson.md`.
- Markdown runs on Astro 7's default processor, Sätteri (`@astrojs/markdown-satteri`): extend it
  with Sätteri hast/mdast plugins (see `src/lib/wrap-tables-plugin.ts`), not remark/rehype.
  `headingAnchorsPlugin` gives h2/h3 an id (same slugger as Astro, pronunciation in `<rt>` left
  out) and a "#" anchor link; restart the dev server after changing Markdown config.
- Semantic tokens (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`,
  `--color-border`, `--color-brand`, `--color-teal`, `--color-danger`, ...) are redefined
  per theme. Components use only semantic tokens, never raw hex. The Tailwind default
  palette is reset; the raw `brand-*` / `teal-*` scale utilities still compile (they back the
  theme), but components must not use them.
- Radius: about 10–12px for controls, 16–20px for cards. Touch targets 44px or more.
- Style: clean, calm, lots of white space. No gradient washes, no emoji in the UI,
  no "K-pop pink".

## Logo

The mark is ㄱ + ㄴ rotated 180° against each other, interlocking into a square.
The wordmark is "Just / Korean", two lines, bold rounded geometric sans.

Refined vector (variant A, 100×100 grid, stroke weight 20, equal gaps):

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0H100V66H80V20H0Z" fill="currentColor"/>
  <path d="M0 34H20V80H100V100H0Z" fill="currentColor"/>
</svg>
```

Variant B (rounded) for avatars: two polylines `10,10 90,10 90,58` and
`10,42 10,90 90,90`, `stroke-width:20`, round caps and joins.
Variant C (two-tone): second path in brand-700.
The final variant is TBD. Make the component accept a `variant` prop.
The wordmark font is unknown: use Outfit 700 for now.

## Planned information architecture (early sketch)

The current content model is the 2026-10-14 spec (lessons as the hub, a YouTube video is
optional; series, grammar, materials, decks, quizzes, notices, settings). The routes below are the
early sketch; each later cycle settles its own routes in its spec.

```
/                    Home
/courses/[series]    Ordered series with progress (Crash Course 10, Pronunciation 11,
                     Speaking like a Korean 6, Shadowing 6)
/grammar             Grammar reference (54 videos), searchable by pattern, e.g. 아/어 봤자
/grammar/[pattern]   Pattern page: meaning, formation, examples with audio, video, quiz, compare-with
/vocabulary          Vocabulary (28 videos) + flashcard sets
/podcast             Podcast (21) + Listening (20): episodes, player, transcript PDFs
/watch/[video]       Any video: embed + tabs (Key expressions / Notes & PDF / Quiz),
                     series sidebar, prev/next
/materials           All files with filters (Class Helper, Podcast transcripts, Extra Notes)
/practice            Flashcards, quizzes, basic dictionary
/classes             1:1, small group, group; FAQ; booking (Tally / Cal.com)
/news                Notices (with active from/to dates) + blog
/news/[slug]         Post
/about, /contact     Contact form via Tally
```

Data decisions already made:

- **No YouTube API at runtime or build.** A lesson entry (`src/content/lessons/<slug>.md`) may
  carry a YouTube link; thumbnails come from `https://i.ytimg.com/vi/<id>/hqdefault.jpg`, fetched
  and optimised at build. Embeds use a click-to-load facade (lite-youtube style).
- A one-time import script may seed these files. After that, the repo is the source of truth.
- Notices: title, body, `activeFrom`, `activeTo`. The home strip shows only active ones.
- No accounts. "Progress" (watched videos, quiz results) lives in localStorage.
  Restricted student materials may later use Cloudflare Access (TBD).
- Search via Pagefind (static).

## Conventions

- Keep the static output fast: zero JS by default, islands only where needed.
- All user-facing strings go through the i18n dictionary or content. No hardcoded UI copy in components.
- Accessible markup: real buttons and links, labels, `aria-label` on icon buttons, visible focus.
- Commit in small steps with clear messages.

## Decisions from Phase 1 setup (2026-10-11)

- Project lives directly in the repo root (no subfolder). Scaffolded with
  `npm create astro` (minimal) + `astro add tailwind svelte sitemap`.
- Package manager: **npm**.
- Icons and share image: `npm run icons` renders `public/*.png` from the logo and shapes in
  `src/components/shapes/paths.ts` (re-run after logo/colour changes; commit the PNGs).
- Print: `src/styles/print.css` prints content only, dark ink on white, in any theme. Mark UI
  that should not print with `data-print="hide"`; buttons, shapes and collages are hidden already.
- Browser checks: `npm run test:browser` builds, then runs `tests/` with Playwright in the locally
  installed Chrome: axe (WCAG 2.1 A/AA) on every page in both themes, desktop and mobile; a
  keyboard skip-link test; print rendering (`tests/print`); mobile menu and page transitions (`tests/ui`); a performance budget on a
  throttled phone (`tests/perf`: LCP < 2 s, CLS < 0.1, one render-blocking CSS < 25 KB brotli, no
  external JS, fonts ≤ 300 KB on the English home). Recheck real numbers with PageSpeed Insights after hosting. Add new page templates to
  `tests/a11y/pages.spec.ts`.
- Tests: Vitest (`npm test`). `npm run check:dist` (after `npm run build`) checks the built HTML: styleguide is English-only and unindexed, no duplicate SVG ids, no ragged-edge filters, quiz ARIA, interactive cards are links, mobile current page is marked.
- **Domain: TBD.** Will likely be bought via Cloudflare. Until then `SITE_URL` in
  `astro.config.mjs` is a placeholder; pages read it as `Astro.site`.
- Links (TidyCal, Tally forms, social, R2 base URL) live in `src/content/settings/site.yml`,
  editable in Pages CMS. Empty footer links are left out; "Book a class" falls back to the Classes
  page until the TidyCal link is set. Form fields carry the same limits as the schemas (tested).

## Decisions from the content cycle (2026-10-14)

- Content lives in `src/content/` (one file per entry; Markdown for long text, YAML for data).
  Schemas: `src/content/schemas.ts` (the source of truth). Pages read content **only** through
  `src/content/queries.ts`, which resolves references; the home page calls
  `validateReferences()`, so a reference to a missing entry fails the build.
- `.pages.yml` mirrors the schemas; `src/content/pages-config.test.ts` fails when a form and its
  schema disagree, or a field has no hint. Change both together.
- Files (PDF, audio, photo) live in Cloudflare R2; content stores `https://` links only.
  `npm run check:links` checks them (skips the `.example` placeholder domain); run before deploy.
- Content is single-language (English with Korean examples); only the UI is translated.
- Serif display font (Gowun Batang 700) is loaded only for the glyphs in
  `src/lib/display-text.ts`: after changing that text run `npm run fonts` (regenerates
  `src/styles/display-font.css`; a unit test fails until you do). Home block styles:
  `src/styles/home.css`. Notice strip hides notices outside their dates in the browser; tones
  `important` (red) / `news` (green) / `info` (blue) set order and the colour of the type word and
  dates, on one continuous striped band; up to three show, rows have equal height;
  `pinned` notices have no close button.
- Korean UI strings are machine-drafted for design testing and marked
  `// TODO(ko-review)` — JiEun should review them before launch.
- Theme toggle is a small vanilla script, not a Svelte island (zero-JS default).
- Page transitions: browser-native cross-document View Transitions (`@view-transition` in
  `signature.css`), header pinned via `view-transition-name`; off under reduced motion. No JS router.
- Page bodies live in `src/views/`; `src/pages/` and `src/pages/ko/` hold thin route files.
- `localized404()` in `astro.config.mjs` moves `ko/404/index.html` to `ko/404.html`
  so Cloudflare serves it for missing `/ko/...` URLs.
- Wrangler (Cloudflare CLI) is a devDependency: `npm run deploy` builds and uploads `dist/`.
- Git commits: no co-author trailer. No remote yet.

## Astro tooling

- Dev server in background: `npx astro dev --background`; manage with
  `astro dev stop|status|logs`.
- Check before committing: `npm run check` (astro check) and `npm run build`.
- Docs: https://docs.astro.build (routing, i18n, content collections, styling guides).
