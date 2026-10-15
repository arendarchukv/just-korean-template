/**
 * DEMO ONLY — content for the Site info page (`/site-info/`), which explains the content model and
 * shows the design system while the site is being reviewed. It is not part of the live site:
 * delete this file, `src/views/site-info/`, `src/pages/site-info/`, `src/lib/cms-forms.ts` and the
 * "Site info" nav item before launch. English-only copy, exempt from the i18n dictionary rule.
 */

/** A part of a page in a sketch; a trailing `*` marks the part this unit fills. */
export type SketchRow =
  `${'header' | 'strip' | 'title' | 'text' | 'media' | 'cards' | 'list' | 'search' | 'chips' | 'card' | 'footer'}${'' | '*'}`;

export interface Unit {
  /** What one entry is, in one sentence. */
  what: string;
  /** Where it ends up on the site; links go to a real demo entry. */
  becomes: { text: string; href?: string }[];
  /** Forms this one points to (the arrows in the diagram). */
  refs: string[];
  sketches: { title: string; rows: SketchRow[] }[];
}

/** Keyed by the form's name in `.pages.yml` (checked by site-info.test.ts). */
export const UNITS: Record<string, Unit> = {
  lessons: {
    what: 'One video lesson, or a lesson without a video. The hub everything else points to.',
    becomes: [
      {
        text: 'A lesson page with the player, text, grammar and files',
        href: '/lessons/ge-vs-dorok/',
      },
      { text: 'A row in the Lessons library, inside its series', href: '/lessons/' },
      { text: 'A tile in “New lessons” on the home page (newest three)', href: '/' },
    ],
    refs: ['series', 'grammar'],
    sketches: [
      { title: 'Lesson page', rows: ['header', 'title*', 'media*', 'text*', 'list'] },
      { title: 'Home', rows: ['header', 'strip', 'text', 'cards*'] },
    ],
  },
  series: {
    what: 'A playlist or course that puts lessons in order.',
    becomes: [
      { text: 'A section of the Lessons library', href: '/lessons/' },
      { text: 'Previous / next links on each lesson of a course', href: '/lessons/ge-vs-dorok/' },
    ],
    refs: [],
    sketches: [{ title: 'Lessons library', rows: ['header', 'title*', 'list', 'title*', 'list'] }],
  },
  grammar: {
    what: 'One grammar pattern, such as -게 or -아/어 봤자, with its meaning and notes.',
    becomes: [
      { text: 'A line in the searchable Grammar reference', href: '/grammar/' },
      { text: 'A pattern page with the lessons that explain it', href: '/grammar/ge/' },
    ],
    refs: [],
    sketches: [
      { title: 'Grammar reference', rows: ['header', 'search', 'list*', 'list*'] },
      { title: 'Pattern page', rows: ['header', 'title*', 'text*', 'cards'] },
    ],
  },
  materials: {
    what: 'A set of downloadable files (PDF, audio) kept in Cloudflare R2.',
    becomes: [
      { text: 'A row with download buttons on the Materials page', href: '/materials/' },
      { text: 'A “Lesson” link from the row, when a lesson is chosen' },
    ],
    refs: ['lessons'],
    sketches: [{ title: 'Materials', rows: ['header', 'chips', 'list*', 'list'] }],
  },
  decks: {
    what: 'A ready-made deck of flashcards: Korean on the front, meaning on the back.',
    becomes: [
      {
        text: 'A flashcards page; progress is kept in the visitor’s browser',
        href: '/practice/deck/negative-form/',
      },
      { text: 'A link on the Practice page and on its lesson', href: '/practice/' },
    ],
    refs: ['lessons'],
    sketches: [{ title: 'Deck page', rows: ['header', 'title', 'card*', 'text'] }],
  },
  quizzes: {
    what: 'A short quiz: multiple-choice and fill-in-the-gap questions.',
    becomes: [
      { text: 'A quiz page with answers checked at once', href: '/practice/quiz/ge-vs-dorok/' },
      { text: 'A link on the Practice page and on its lesson', href: '/practice/' },
    ],
    refs: ['lessons'],
    sketches: [{ title: 'Quiz page', rows: ['header', 'title', 'card*', 'text'] }],
  },
  notices: {
    what: 'A short announcement with dates, e.g. a winter break or a new group.',
    becomes: [
      {
        text: 'A line in the strip under the header of the home page, only between its dates',
        href: '/',
      },
    ],
    refs: [],
    sketches: [{ title: 'Home', rows: ['header', 'strip*', 'text', 'cards'] }],
  },
  site: {
    what: 'One settings file: booking and form links, social links, the R2 address.',
    becomes: [
      { text: '“Book a class” buttons (TidyCal) and the contact form (Tally)', href: '/classes/' },
      { text: 'Social links in the footer of every page' },
    ],
    refs: [],
    sketches: [{ title: 'Every page', rows: ['header*', 'text', 'text', 'footer*'] }],
  },
};

/** What is edited in code, not in Pages CMS (changes rarely; ask the developer). */
export const HARDCODED = [
  { text: 'About her: home intro, About page story and timeline', where: 'src/data/teacher.ts' },
  { text: 'Classes: formats, facts, how to start, FAQ', where: 'src/data/classes.ts' },
  { text: 'Interface text in English and Korean (menus, buttons)', where: 'src/i18n/ui.ts' },
  {
    text: 'Home buttons to the dictionary, pronunciation and news sites',
    where: 'src/data/links.ts',
  },
];
