# Holiday decorations — design

Date: 2026-10-24. Status: draft for the owner's review.

## Intent

On five Korean holidays the site shows a restrained holiday touch: one cut-paper motif in the home
hero collage, a small holiday label, one line of greeting, and a few light echoes elsewhere. It is the
same site with a few themed details, not a holiday redesign. Holidays are part of learning a
language and its culture, so the touch belongs to the subject.

The owner's reference mock (2026-10-24) showed the idea: a holiday pill above the hero title
("추석 · Chuseok"), a holiday motif beside the photo, a small greeting, faint motifs in other places.
Its cream background and painted illustrations are **not** taken over.

## Goals

- Five holidays: 추석 Chuseok, 설날 Seollal, Christmas, 한글날 Hangul Day (9 October), 광복절
  Liberation Day (15 August).
- In Automatic mode it turns itself on and off by date, with no build (builds are rare and manual).
- One select in Site settings (Pages CMS), "Holiday decorations": **None** (default), **Automatic
  by date**, or one holiday chosen by hand (shown until changed). Decided by the owner 2026-10-24.
- A test switch in the header (DEMO ONLY) that shows any holiday at once, for review.
- Each holiday's motifs and assets in its own folder.

## Non-goals and anti-goals

- No holiday colour scheme, no background change, no animation beyond the site's existing hover
  details, no falling snow or confetti, no emoji.
- No ragged, textured or painted shapes: smooth cut-paper geometry only, in the semantic tokens
  (brand blue, teal, paper, indigo, danger red only where a motif needs red), both themes.
- Nothing that moves layout: motifs sit in space that is already decorative.
- No CMS form for holidays: the list is hardcoded like the playlists.
- Not on content pages' reading areas (lesson text, practice cards stay untouched).

## What the visitor sees

1. **Home hero.** One holiday motif joins the existing collage around her photo (grid paper, wave,
   arch, teal dot); it replaces one of the generic shapes so the collage does not grow. Above the
   hero title a small pill: the Korean name and the name in the page language, e.g.
   `추석 · Chuseok`, `추석 · Чхусок`.
2. **Greeting.** One short line under the pill or in it, in the page language, e.g. "Happy
   Chuseok! 즐거운 추석 보내세요." Five languages, machine-drafted for ko/es/id/uk with
   `TODO(<lang>-review)` like the rest of the UI.
3. **Light echoes, no text.** A small version of the motif in two places at most: next to the
   home section heads (e.g. beside "New lessons"), and in the footer's top corner. Hidden on phones
   if they crowd the layout.

Motifs (one main + one small echo each, cut-paper style):

| Holiday      | Main motif                                                                          | Echo            |
| ------------ | ----------------------------------------------------------------------------------- | --------------- |
| 추석 Chuseok | Full moon disc with a persimmon branch                                              | Small persimmon |
| 설날 Seollal | 매듭 knot charm (norigae)                                                           | Small knot      |
| Christmas    | Pine sprig with red berries                                                         | Small star      |
| 한글날       | Paper tiles with ㄱ ㅏ ㄴ (Hangul jamo), in the site's grid-paper (원고지) language | One jamo tile   |
| 광복절       | 태극 disc with a 무궁화 (rose of Sharon)                                            | Small 무궁화    |

## Dates and when each shows

Shown from the first to the last day below, by the visitor's own date (as the notice strip does):

- Chuseok and Seollal: from 3 days before the holiday to its last official day off. Lunar dates,
  so a table per year, 2026–2035, checked against the official Korean calendar (KASI 한국천문연구원
  / 공휴일 list) during implementation. After 2035 the feature simply shows nothing for these two
  until the table is extended (a unit test warns two years ahead).
- Christmas: 20–26 December.
- 한글날: 8–9 October. 광복절: 14–15 August.

If two windows overlap (they do not with these dates), the first in the list wins.

## How it works

- `src/data/holidays.ts`: the list (id, Korean name, names in every interface language as
  `Localized`, greeting as `Localized`, date windows; lunar ones as a per-year table). Pure date
  logic in `src/lib/` with unit tests.
- `src/components/holidays/<id>/`: one folder per holiday with its motif components (main, echo).
  Shapes are inline SVG, clean paths, semantic tokens only, `aria-hidden` (decorative); the pill and
  greeting are real text.
- All five holidays' markup is in the built page, hidden; a small inline script (like the notice
  strip's) sets `data-holiday="<id>"` on `<html>` when today falls in a window, and CSS shows that
  holiday's pieces. Without JS nothing shows. No JS file is added, so `check:dist`'s rule holds.
  The inline SVG must stay small: the CSS budget (25 KB brotli) and the HTML size are checked.
- Site settings: a select `holiday` in `site.yml`, `.pages.yml` and `siteSchema`: `none` (default),
  `auto`, or a holiday id. `none`: no holiday markup or script at all. A holiday id: the build writes
  `data-holiday="<id>"` on `<html>`, no script. `auto`: the date script below.
- **Test switch (DEMO ONLY):** a small select in the header, "Holiday: none / 추석 / 설날 /
  Christmas / 한글날 / 광복절", that sets `data-holiday` at once, overriding the date (kept for the
  session in `sessionStorage`). Marked DEMO ONLY in code, listed in CLAUDE.md for removal before
  launch.

## Quality

- Unit tests: date windows (boundaries, lunar table years, the two-years-ahead warning).
- `check:dist`: every holiday's markup present and hidden by default; nothing visible without JS.
- Browser tests: each holiday via the test switch, both themes, desktop and phone; axe passes; no
  layout shift (CLS budget) when a holiday turns on after load.
- Print: holiday decoration hidden (`collage` rules already hide decorative shapes).

## Left to the builder

- Exact motif drawings within the rules above (several sketches, the owner picks).
- Exact placement and sizes of echoes; dropping an echo that crowds a layout.
- Greeting wording in English (the owner or JiEun may rewrite it).
