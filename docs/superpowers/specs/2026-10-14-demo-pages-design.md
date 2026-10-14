# Demo pages — design

Date: 2026-10-14. Status: approved in conversation, awaiting review of this written spec.
Builds on `2026-10-14-content-model-and-home-design.md` (content model, CMS, home page).

## Why

The home page and the content model exist; the rest of the site is placeholders. This cycle fills
every section with real pages built on the demo content, so the demo shows the whole site and is
the base for the full one. Everything here is static; interactive flashcards, quizzes with
results, and news reading are later cycles.

## Shared rules

- Every page exists in English and Korean (`/…`, `/ko/…`); content is single-language, only the
  UI is translated (strings in `src/i18n/ui.ts`, Korean marked `TODO(ko-review)`).
- Each page has its own form (list, table of contents, reference, timetable), not repeated cards.
  Design system tokens and classes only.
- Header navigation becomes **Lessons · Grammar · Materials · Practice · Classes**. `/learn/` is
  removed (its links move to `/lessons/`); `/news/` stays a placeholder reached from 목차 item 05.
  The home 목차 links point to the new pages.
- JavaScript only where it cannot be avoided: the video facade and the grammar filter. Without JS
  every page still works (video becomes a YouTube link, the grammar list shows in full).
- Pages read content only through `src/content/queries.ts`; pure logic lives in `src/lib/`.

## Pages

### 1. Lessons — `/lessons/`

Series in CMS `order`. A `course` series is a numbered list of episodes (by `episode`), like a
table of contents; `library` and `podcast` series show a grid of thumbnails (newest first).
Lessons without a series go to a final "Other lessons" group. Each series shows its description
and a "Playlist on YouTube" link when set.

### 2. Lesson — `/lessons/<id>/` (replaces the placeholder)

- Video facade: the local thumbnail with a play button; on click a `youtube-nocookie.com` iframe
  replaces it (autoplay). No request to Google before the click. Without JS the button is a link
  to the video on YouTube. Lessons without a video show no player.
- Title, series label and episode, summary, then the lesson body in `.prose`.
- "Grammar in this lesson": links to the grammar pages of its patterns.
- Files: one row per download with a kind label (PDF / Audio / Transcript); external link, opens
  in a new tab.
- Practice for this lesson: links to its deck and quiz, if any (to `/practice/#<id>` for now).
- Series sidebar (desktop) / below content (phone): the series list with the current lesson
  marked; previous / next lesson in the series.

### 3. Grammar — `/grammar/` and `/grammar/<id>/`

- Index: patterns grouped by level, each with its meaning in one line. A search field filters the
  list by pattern or meaning (inline script); without JS the whole list shows and the field is
  hidden.
- Pattern page: the pattern large (Korean), meaning, formation, examples (Korean on 원고지 grid
  paper with the translation), "Compare with" links, and "Videos about this pattern" (lessons
  whose `grammar` lists it, found by the site).

### 4. Materials — `/materials/`

Anchor chips at the top: Class Helper · Podcast · Extra notes · From lessons. Each section is a
list; a row shows the title, date, tags, one button per file (kind label) and, if linked, the
lesson. "From lessons" lists every lesson download. Empty sections are left out.

### 5. Classes — `/classes/`

The timetable from the home page (shared component, extracted from `ClassesTable.astro`), then the
FAQ as `<details>` items, then the booking button (TidyCal, or contact when unset). Demo FAQ is
marked for review in `classes.yml`.

### 6. Practice — `/practice/`

- Flashcard decks: title, level, number of cards, linked lesson; each with an anchor id.
- Quizzes: title, level, number of questions, linked lesson; each with an anchor id.
- A quiet "Interactive version coming soon" note; no fake buttons.
- Dictionary: a GET form to krdict
  (`https://krdict.korean.go.kr/eng/dicMarinerSearch/search`, hidden `nation=eng`,
  `nationCode=6`, field `mainSearchWord`), opening in a new tab. Works without JS.
- Pronunciation: link to 누리-세종학당 pronunciation practice and, when it exists, the
  pronunciation series.

## Demo content additions

Lesson body text in two lessons (marked draft), one more grammar pattern with examples, 3–4 FAQ
items (marked draft), one Podcast material.

## Feature checklist

A living file `docs/features.md` maps each feature JiEun asked for (her email of 2026-10-14) to
where it lives on the site and its status, and is updated at the end of every cycle. CLAUDE.md
links to it. Initial content:

| #   | Her wish                          | Where on the site                                                     | Status                                                    |
| --- | --------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Class booking (TidyCal)           | "Book a class" buttons (header, home, Classes); link in Site settings | Buttons done; waiting for her TidyCal link                |
| 2   | Flashcards                        | `/practice/` decks; lesson page links                                 | Decks listed (this cycle); interactive study: later cycle |
| 3   | Upload / download materials       | `/materials/`, lesson files; files in R2, links in CMS                | This cycle                                                |
| 4   | Pronunciation practice            | `/practice/` → 누리-세종학당 + pronunciation series                   | Link this cycle; own feature: later if wanted             |
| 5   | Dictionary                        | `/practice/` krdict search form                                       | This cycle                                                |
| 6   | Email contact                     | Footer "Contact" → Tally form (Site settings)                         | Waiting for her Tally form                                |
| 7   | Videos + downloadable transcripts | Lesson page: player + files                                           | This cycle                                                |
| 8   | Quizzes with results sent to her  | `/practice/` quizzes; lesson page links                               | Listed (this cycle); taking + Tally results: later cycle  |
| 9   | Korean news reading               | Home 목차 05 → `/news/`                                               | Later cycle (RSS; copyright check for OhmyNews)           |

## Testing

- Unit (pure logic in `src/lib/`): series grouping and order, previous/next in a series, lessons
  for a grammar pattern, materials aggregation (sections, "From lessons"), krdict URL/form fields,
  YouTube embed URL.
- `check:dist`: every new page exists in both languages; all internal links in the new pages point
  to built pages; the lesson page contains no YouTube iframe before interaction; navigation shows
  the five sections and no `/learn/`.
- Playwright: axe on every new template in both themes (desktop, mobile); clicking play inserts a
  `youtube-nocookie` iframe; the grammar filter narrows the list and "no results" is announced;
  the performance budget also covers a lesson page.

## Out of scope (later cycles)

Interactive flashcards (study mode, progress), quizzes with results via Tally, Korean news reading
(RSS), search across the site (Pagefind), Korean content translations.
