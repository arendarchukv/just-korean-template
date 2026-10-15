# Simple content model — design

Date: 2026-10-15. Replaces the content model of `2026-10-14-content-model-and-home-design.md`
(forms, references) and the Materials page of `2026-10-14-demo-pages-design.md`.

## Why

After the demo review: Pages CMS felt complicated. Eight forms point at each other (a deck, quiz
or material picks its lesson from a list; a lesson picks its series and grammar patterns). Adding
words to a lesson meant opening another form. Goal: clear, simple, close to the logic of her own
old site (https://just-korean-academy.vercel.app/), in our design.

## Decisions (agreed in chat)

- **The lesson is a container.** A lesson may carry its own **Words**, **Quiz** and **Files**,
  filled in right in the lesson form. The same parts can also be added **separately**.
- **Same shape both ways.** A word (Korean, meaning, example), a question (choice or fill-in) and a
  file (label, kind, link) look the same inside a lesson and in a separate entry (shared Pages CMS
  components).
- **No references between forms.** Nothing is picked from another collection.
- **Series → playlists in code** (`src/data/playlists.ts`: id, title, kind, description, YouTube
  playlist). They change rarely. A lesson picks a playlist from a fixed list. The episode number
  is dropped: a course is ordered by date.
- **Grammar → tags on the lesson** (free text, e.g. `-게`). The grammar page is built from the
  tags: each tag with the lessons that explain it. No grammar form, no pattern pages.
- Notices and Site settings stay as they are.

## Pages CMS forms (6, was 8)

| Form          | Fields                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Lessons       | title, YouTube, playlist (choice), date, level, summary, grammar tags, **words**, **quiz**, **files**, lesson text                      |
| Words         | title, level, description, words (min 1) — collection folder `decks`                                                                    |
| Quizzes       | title, level, questions (min 1)                                                                                                         |
| Materials     | title, section (Class materials / Podcast / Self-study), type (Reading / Writing / Listening / Vocabulary / Video), date, files (min 1) |
| Notices       | unchanged                                                                                                                               |
| Site settings | unchanged                                                                                                                               |

Field keys kept where the site already uses them: word = `front` / `back` / `example` (labels
"Korean", "Meaning", "Example"); deck words = `cards`; files = `label` / `kind` / `url`.

## Site

- **Practice** lists every deck and quiz: separate ones and those inside lessons. A lesson's deck
  and quiz take the lesson's id and title (`/practice/deck/<lesson-id>/`, `/practice/quiz/<lesson-id>/`)
  and link back to the lesson. The build fails if a separate deck or quiz has the same id as a
  lesson that has its own.
- **Lesson page**: player, text, grammar tags (links to the tag on the grammar page), files,
  links to its deck and quiz, playlist navigation.
- **Grammar** (`/grammar/`, not in the menu): tags A→Z (Korean order), each with its lessons; the
  existing filter stays.
- **Materials** (old-site logic, our design): tabs Class materials · Podcast · Self-study · From
  lessons (only non-empty ones). Each tab is a dense ruled table, newest first: type · title ·
  file buttons · date. Above it a type filter and a title search. Without JS: all sections one
  after another, full lists. Not taken from the old site: download counters (need a server) and
  paging (filter + search do the job).

## Demo content migration

The quiz `ge-vs-dorok` moves into its lesson; the deck `negative-form` moves into its lesson; one
new separate deck and one separate quiz show the other path. Grammar entries become tags on their
lessons. Materials get a section and a type.

## Testing

Unit: schemas, `.pages.yml` drift test (components, playlist options = `PLAYLISTS`), pure logic
(practice units, grammar tags, material tabs, playlist order). `check:dist`: derived from content
files (lesson front matter included). Browser: axe on the new pages, Materials tabs/filter, lesson
deck/quiz pages work.
