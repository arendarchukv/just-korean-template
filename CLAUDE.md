# Just Korean — project brief for Claude Code

This file records decisions made during planning. Anything marked **TBD** is still being
discussed with the site owner — do not build it yet.

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
5. Theme toggle (light / dark / system) with an inline head script so there is no flash
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
- Neutrals are cool greys. Light: background #FFFFFF, surface #F3F5F8,
  border #E3E8EF, text #1F2937, muted text #4B5563. Dark: background #0E1A2B,
  surface #16243A, text #EAF2FD, muted text #9FB3CC.
- At most one warm accent (muted coral, e.g. #C2552B, which passes AA with white),
  used sparingly for key CTAs and "correct" quiz states.
- Semantic tokens (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`,
  `--color-border`, `--color-accent`, `--color-brand`) are redefined per theme.
  Components use only semantic tokens, never raw hex.
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

## Planned information architecture (later phases — build only empty routes or placeholders if useful)

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

- **No YouTube API at runtime or build.** Each video is a content entry keyed by
  its YouTube ID (`src/content/videos/<id>.md`): id, title (her own wording),
  series, order, level, tags, plus optional pdf/audio URLs, key expressions and
  quiz. Thumbnails come from `https://i.ytimg.com/vi/<id>/hqdefault.jpg`. Embeds use
  a click-to-load facade (lite-youtube style).
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
- **Domain: TBD.** Will likely be bought via Cloudflare. Until then `SITE_URL` in
  `astro.config.mjs` is a placeholder; pages read it as `Astro.site`.
- Footer / social links: empty placeholders in `src/config.ts` (contact will be a Tally form).
- Korean UI strings are machine-drafted for design testing and marked
  `// TODO(ko-review)` — JiEun should review them before launch.
- Theme toggle is a small vanilla script, not a Svelte island (zero-JS default).
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
