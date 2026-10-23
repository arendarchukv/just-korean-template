# Holiday decorations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On five Korean holidays the site shows a pill, a greeting and cut-paper motifs, chosen
by the visitor's date in the browser, switchable off in Site settings, with a DEMO ONLY header
switch to preview any holiday.

**Architecture:** Holiday data and date windows live in `src/data/holidays.ts` (pure logic in
`src/lib/holiday-logic.ts`). An inline head script sets `data-holiday="<id>"` on `<html>` before
first paint; every holiday's markup is in the page, hidden, and CSS shows the active one. Each
holiday's SVG motifs live in their own folder under `src/components/holidays/<id>/`.

**Tech Stack:** Astro 7 static, inline vanilla scripts (no JS files), Tailwind v4 + plain CSS,
Vitest, Playwright, Pages CMS (`.pages.yml`).

**Spec:** `docs/superpowers/specs/2026-10-24-holiday-decorations-design.md`

## Global Constraints

- Holidays: `seollal` 설날, `chuseok` 추석, `christmas` 크리스마스, `hangeulnal` 한글날, `gwangbokjeol` 광복절.
- Windows: Seollal and Chuseok from 3 days before the holiday to the day after it; Christmas
  12-20 to 12-26; 한글날 10-08 to 10-09; 광복절 08-14 to 08-15. Years 2026–2035.
- Seollal days: 2026-02-17, 2027-02-07, 2028-01-27, 2029-02-13, 2030-02-03, 2031-01-23,
  2032-02-11, 2033-01-31, 2034-02-19, 2035-02-08.
- Chuseok days: 2026-09-25, 2027-09-15, 2028-10-03, 2029-09-22, 2030-09-12, 2031-10-01,
  2032-09-19, 2033-09-08, 2034-09-27, 2035-09-16. (Checked against superkts.com and Wikipedia's
  2027 holiday list; Korean dates, KST.)
- Visitor's local date decides (same as the notice strip); without JS nothing shows.
- No JS files (check:dist); inline scripts only. Shared CSS stays under 25 KB brotli.
- Motifs: smooth cut-paper geometry, semantic colour tokens only, both themes, `aria-hidden`; no
  emoji, no textures, no displacement filters, no layout shift.
- UI text in all five languages; ko/es/id/uk machine-drafted with `TODO(<lang>-review)`.
- Test switch: DEMO ONLY comment in every file it touches; English-only; listed in CLAUDE.md.
- Site setting `holidays` (boolean, default true): off means no holiday markup or script at all.

## Review Focus

- A visitor whose clock is in a window at midnight boundaries (day before/after) → shown exactly on
  window days (Task 1 boundary tests).
- A year past 2035 → nothing shows, no error (Task 1 test).
- Test switch set to a holiday, then the page reloaded or another page opened → the same holiday
  stays for the session; "none" clears it (Task 5 browser test).
- Holidays off in Site settings → no pill, no motif, no script in the HTML (Task 2 check:dist).
- Dark theme with a holiday on → motifs and pill readable, axe passes (Task 6 browser test).

---

### Task 1: Holiday data and date windows

**Files:**

- Create: `src/data/holidays.ts`, `src/lib/holiday-logic.ts`, `src/lib/holiday-logic.test.ts`
- Modify: `src/data/translations.test.ts` (holidays in every language)

**Interfaces:**

- Produces:
  - `type HolidayId = 'seollal' | 'chuseok' | 'christmas' | 'hangeulnal' | 'gwangbokjeol'`
  - `HOLIDAYS: readonly { id: HolidayId; korean: string; text: Localized<{ name: string; greeting: string }> }[]` (order = priority)
  - `LUNAR_DAYS: Record<'seollal' | 'chuseok', Record<number, string>>` (year → `YYYY-MM-DD`)
  - `holidayWindows(): { id: HolidayId; from: string; to: string }[]` (all years 2026–2035, ISO days)
  - `holidayOn(today: string, windows = holidayWindows()): HolidayId | undefined`

- [ ] **Step 1: Write the failing tests** in `src/lib/holiday-logic.test.ts`:
  - `holidayOn('2026-09-22')` = `'chuseok'`; `'2026-09-21'` → `undefined`; `'2026-09-26'` = `'chuseok'`; `'2026-09-27'` → `undefined`
  - `holidayOn('2027-02-04')` = `'seollal'`; `'2027-02-08'` = `'seollal'`; `'2027-02-09'` → `undefined`
  - `holidayOn('2026-12-20')` / `'2026-12-26'` = `'christmas'`; `'2026-12-27'` → `undefined`
  - `holidayOn('2026-10-08')` = `'hangeulnal'`; `holidayOn('2026-08-14')` = `'gwangbokjeol'`
  - `holidayOn('2036-12-25')` → `undefined` (past the table)
  - every year 2026–2035 has both lunar days; the last table year ≥ `new Date().getFullYear() + 2`
    (fails two years before the table runs out)
- [ ] **Step 2: Run** `npx vitest run src/lib/holiday-logic.test.ts` — expect FAIL (module missing).
- [ ] **Step 3: Implement** the data (Global Constraints values; English names Seollal, Chuseok,
      Christmas, Hangul Day, Liberation Day; greetings e.g. "Happy Chuseok!") and the two functions.
      `holidayWindows` adds −3/+1 days to lunar days by UTC date arithmetic on `YYYY-MM-DD` strings.
- [ ] **Step 4: Add** a `holidays in ${lang}` case to `translations.test.ts` (`sameShape(text.en, text[lang])`), fill ko/es/id/uk with `TODO(<lang>-review)` comments.
- [ ] **Step 5: Run** `npm test` — all pass.
- [ ] **Step 6: Commit** `git commit -m "Holidays: data, date windows 2026–2035, tests"`

### Task 2: Site setting and the head script

**Files:**

- Modify: `src/content/schemas.ts` (`siteSchema.holidays: z.boolean().default(true)`),
  `src/content/settings/site.yml` (`holidays: true`), `.pages.yml` (boolean field, label
  "Holiday decorations", description "Show small decorations and a greeting on Korean holidays
  (Seollal, Chuseok, Christmas, Hangul Day, Liberation Day)."), `src/layouts/BaseLayout.astro`,
  `scripts/check-dist.mjs`
- Create: `src/components/holidays/HolidayScript.astro`

**Interfaces:**

- Consumes: `holidayWindows()`.
- Produces: `<html data-holiday="<id>">` when active; `sessionStorage['holiday-preview']` (an id or
  `'none'`) overrides the date (read by the script, written by Task 5's switch).

- [ ] **Step 1:** `HolidayScript.astro`: inline script, `define:vars={{ windows }}`, placed in
      `<head>` right after `<ThemeScript />` only when `site.holidays`; computes the local day like
      `NoticeStrip`; preview override wins; never throws (try/catch around storage).
- [ ] **Step 2:** check-dist: built `index.html` has no `data-holiday` attribute on `<html>`, holds
      the holiday script when `site.yml` says `holidays: true`; a schema unit test that `holidays`
      defaults to `true` when missing.
- [ ] **Step 3: Run** `npm test`, `npm run check`, `npm run build && npm run check:dist` — pass.
- [ ] **Step 4: Commit** `git commit -m "Holidays: Site settings switch and the date script"`

### Task 3: Pill and greeting in the home hero

**Files:**

- Create: `src/components/holidays/HolidayGreeting.astro`, `src/styles/holidays.css`
- Modify: `src/components/home/AboutHero.astro`, `src/styles/global.css` (import)

**Interfaces:**

- Consumes: `HOLIDAYS`, `pick`.
- Produces: elements marked `data-holiday-piece="<id>"`, hidden by default; CSS
  `:root[data-holiday="<id>"] [data-holiday-piece="<id>"] { display: revert }` generated for the five ids.

- [ ] **Step 1:** Greeting: above the hero `<h1>`, per holiday a pill (`<span lang="ko">추석</span> · Chuseok`)
      and one greeting line; tinted pill like the notice type pills; real text.
- [ ] **Step 2:** check-dist: five pieces in `index.html` and `ko/index.html`, all hidden by default.
- [ ] **Step 3: Run** checks; commit `git commit -m "Holidays: pill and greeting in the home hero"`.

### Task 4: Motifs (one folder per holiday)

**Files:**

- Create: `src/components/holidays/<id>/Main.astro` and `Echo.astro` for the five ids
- Modify: `src/components/home/HeroPortrait.astro` (main motifs, the teal dot hidden while a
  holiday is on), `src/components/SectionHead.astro` (optional `echo` slot used by `NewLessons`),
  `src/components/Footer.astro` (echo in the top corner), `src/styles/holidays.css`

**Interfaces:**

- Consumes: Task 3's `data-holiday-piece` convention.

- [ ] **Step 1:** Draw the motifs (spec table): Chuseok moon + persimmon branch / persimmon;
      Seollal 매듭 knot / small knot; Christmas pine sprig with berries / star; 한글날 grid-paper tiles
      ㄱ ㅏ ㄴ / one tile; 광복절 태극 disc + 무궁화 / 무궁화. Inline SVG, ≤ 1.5 KB each, tokens only.
- [ ] **Step 2:** Place: main motif in the hero collage where the teal dot sits (no size change of
      `.hero-portrait`); echoes hidden below 40rem if they crowd.
- [ ] **Step 3:** check-dist: no `feTurbulence`/`feDisplacementMap` in holiday SVGs; unique ids.
- [ ] **Step 4: Run** checks; commit `git commit -m "Holidays: cut-paper motifs per holiday"`.
- [ ] **Step 5:** Owner review via the test switch (Task 5); redraw what is rejected.

### Task 5: DEMO ONLY test switch in the header

**Files:**

- Create: `src/components/holidays/HolidayPreview.astro`, `tests/ui/holidays.spec.ts`
- Modify: `src/components/Header.astro`, `CLAUDE.md` (DEMO ONLY list)

**Interfaces:**

- Consumes/Produces: `sessionStorage['holiday-preview']`, `data-holiday` on `<html>`.

- [ ] **Step 1: Write the failing browser test:** choose "추석" in the switch → the Chuseok pill is
      visible; reload → still visible; open `/ko/` → still visible; choose "None" → hidden.
- [ ] **Step 2:** A labelled `<select>` ("Holiday preview": None, Auto by date, 설날, 추석, Christmas,
      한글날, 광복절) next to the theme toggle, desktop and mobile menu; inline script; DEMO ONLY comment.
- [ ] **Step 3: Run** `npm run test:browser` — pass; commit `git commit -m "Holidays: DEMO ONLY preview switch"`.

### Task 6: Quality pass and docs

**Files:**

- Modify: `tests/a11y/pages.spec.ts` (home with each holiday, both themes), `tests/perf/budget.spec.ts`
  if needed, `CLAUDE.md`, `docs/features.md`

- [ ] **Step 1:** axe on `/` with each holiday set via `sessionStorage`, light and dark, desktop and mobile.
- [ ] **Step 2:** Run all gates: `npm test`, `npm run check`, `npm run build:test`, `npm run check:dist`,
      `npm run test:browser` — all pass, CSS < 25 KB brotli.
- [ ] **Step 3:** CLAUDE.md (holidays section, DEMO ONLY switch to remove before launch) and
      features.md; commit `git commit -m "Holidays: tests and docs"`. No push until the owner says.
