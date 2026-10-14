# Practice widgets (flashcards, quiz) — design

Date: 2026-10-14. Status: approved in conversation (design), awaiting review of this written spec.

## Why

JiEun asked for flashcards (wish 2) and quizzes (wish 8). Decks and quizzes already exist as
content (Pages CMS) and are listed on `/practice/`; this cycle makes them usable.

## Constraints (from the owner)

- **Minimal.** No complex logic. Each widget stands alone: no links between widgets, no shared
  state, no accounts.
- **Progress only in the visitor's browser** (`localStorage`), and only what a widget needs:
  which cards are known, the best quiz score. Storage may be unavailable: the widget still works.
- Builds are rare and manual: nothing depends on the build date.
- JavaScript only on the pages that hold a widget; every other page stays without JS files.

## Pages

- `/practice/deck/<id>/` and `/practice/quiz/<id>/` (+ `/ko/…`): title, level, linked lesson,
  then the widget. One widget per page.
- `/practice/`: each deck and quiz links to its page (the "coming soon" note goes).
- Lesson page: its deck and quiz link to these pages.
- Widgets are Svelte 5 islands, hydrated `client:visible`. Without JS the page shows the cards
  (front and meaning) or the questions as a plain list, so the content is still readable.

## Flashcards

- One card at a time: Korean front; pressing the card (button) or Space/Enter flips to the
  meaning (and example, if any).
- After flipping: "I know it" (marks it known) and "Again" (stays unknown); both go to the next
  card. A counter shows the position and how many are known.
- At the end: "You know X of N", then "Practise the rest" (only unknown cards; hidden when all are
  known) and "Start over" (clears known).
- Stored: the fronts of known cards, key `jk:deck:<id>`.
- Screen readers hear the side shown and the end summary (live region).

## Quiz

- One question at a time, in content order.
- `choice`: options as buttons (existing `.quiz-option` styles). Choosing one locks the question
  and shows correct / wrong (colour, icon and text) and the explanation.
- `fill`: a text field and "Check". The answer is accepted ignoring surrounding spaces and case;
  `alternatives` are also accepted. Then correct / wrong, the expected answer, the explanation.
- "Next" after each answer. At the end: "X of N correct", best score so far, "Try again".
- Stored: the best score, key `jk:quiz:<id>`.
- Sending the result to her (Tally) is later; nothing is sent.

## Code

- Pure logic in `src/lib/widgets.ts` (unit-tested): `isFillCorrect`, `remainingCards`,
  `readStore` / `writeStore` (JSON in localStorage, try/catch).
- `src/components/widgets/Flashcards.svelte`, `Quiz.svelte`; UI copy passed in as a `labels`
  prop from the Astro page (strings stay in `src/i18n/ui.ts`).
- Styles in `src/styles/widgets.css` with design-system tokens.

## Testing

- Unit: fill checking (case, spaces, alternatives), remaining cards, storage when it throws.
- Playwright: flipping and marking cards, progress kept after reload, "practise the rest";
  quiz choice right/wrong with explanation, fill with an alternative, score and best score kept
  after reload; keyboard flip; axe on the new pages.
- `check:dist`: new pages exist in both languages, practice and lesson pages link to them, the
  no-JS fallback content is in the HTML, pages without widgets still load no JS files.
- Performance: the budget runs on a deck page too; JS on it stays small (< 30 KB brotli).

## Out of scope

Spaced repetition, timers, mixing decks, sharing results, sending results to Tally, new task
types (drag-and-drop, matching).
