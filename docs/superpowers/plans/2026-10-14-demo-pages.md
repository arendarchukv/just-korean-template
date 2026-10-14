# Demo pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real pages for Lessons, Lesson, Grammar (index + pattern), Materials, Classes and Practice, new navigation, and a living feature checklist.

**Architecture:** Pure logic (grouping, ordering, neighbours, aggregation, URLs) in `src/lib/site-logic.ts` with unit tests; content read through `src/content/queries.ts`; one view per page in `src/views/`, thin EN/KO route files in `src/pages/`; page styles in `src/styles/pages.css`. Two small inline scripts: the video facade and the grammar filter.

**Tech Stack:** Astro 7 (content layer, `render`, `astro:assets`), Tailwind v4 tokens, Vitest, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-14-demo-pages-design.md`

## Global Constraints

- Every page exists in English and Korean (`/…`, `/ko/…`); content single-language; UI copy in `src/i18n/ui.ts` (KO under `TODO(ko-review)`).
- Semantic tokens only; text accents use `--color-brand` / `--color-teal` / `--color-danger` (never `*-strong` for text).
- Zero JS by default; only the video facade and grammar filter scripts (inline, try/catch where storage is used). Without JS pages still work.
- Touch targets ≥ 44px; WCAG AA in both themes.
- Performance budget stays green (LCP < 2 s, CLS < 0.1, CSS < 25 KB brotli, no external JS, fonts ≤ 300 KB on the English home).
- Commits without a co-author trailer.

## Review Focus

- A lesson whose series has no other lessons, or a lesson without a series, must render without prev/next errors and appear under "Other lessons" (Task 1 tests).
- A course lesson without an `episode` must still sort (after numbered ones) (Task 1 tests).
- Clicking play on the lesson page must not leave the keyboard focus lost (focus moves to the iframe) (Task 4 test).
- The grammar filter with no match must say so to screen readers, and clearing it restores every group (Task 5 test).
- Materials with no items in a section must not render an empty section or chip (Task 1 + Task 6 check).

---

## File structure

| File                                                                                                                                                               | Responsibility                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/site-logic.ts`                                                                                                                                            | `sortInSeries`, `groupBySeries`, `neighbours`, `lessonsForPattern`, `groupByLevel`, `materialSections`, `KRDICT`, `krdictUrl`, `youtubeEmbedUrl` |
| `src/content/queries.ts`                                                                                                                                           | + `getSeries`, `getGrammar`, `getMaterials`, `getDecks`, `getQuizzes`, `renderBody`                                                              |
| `src/components/Header.astro`                                                                                                                                      | new NAV                                                                                                                                          |
| `src/components/Timetable.astro`                                                                                                                                   | shared classes table (from `ClassesTable.astro`)                                                                                                 |
| `src/components/VideoFacade.astro`                                                                                                                                 | thumbnail → nocookie iframe on click                                                                                                             |
| `src/views/LessonsView.astro`, `LessonView.astro`, `GrammarIndexView.astro`, `GrammarView.astro`, `MaterialsView.astro`, `ClassesView.astro`, `PracticeView.astro` | page bodies                                                                                                                                      |
| `src/pages/{lessons/index,grammar/index,grammar/[id],practice}.astro` (+ `ko/`)                                                                                    | routes                                                                                                                                           |
| `src/styles/pages.css`                                                                                                                                             | page styles                                                                                                                                      |
| `docs/features.md`                                                                                                                                                 | feature checklist                                                                                                                                |

---

### Task 1: Pure site logic

**Files:** Create `src/lib/site-logic.ts`, `src/lib/site-logic.test.ts`

**Interfaces — Produces:**

- `type SeriesKind = 'course' | 'library' | 'podcast'`
- `sortInSeries<L extends { title: string; date: Date; episode?: number }>(lessons: L[], kind: SeriesKind): L[]` — course: by `episode` (missing last), then date; others: newest first, then title.
- `groupBySeries<L extends { id: string; title: string; date: Date; series?: string; episode?: number }, S extends { id: string; title: string; kind: SeriesKind; order: number }>(lessons: L[], series: S[]): { series?: S; lessons: L[] }[]` — series by `order` then title, empty series dropped, lessons without (known) series in a final group without `series`.
- `neighbours<L extends { id: string }>(ordered: L[], id: string): { prev?: L; next?: L }`
- `lessonsForPattern<L extends { grammar: string[]; date: Date }>(lessons: L[], pattern: string): L[]` — newest first.
- `groupByLevel<G extends { level: 'beginner' | 'intermediate' | 'advanced'; pattern: string }>(items: G[]): { level: G['level']; items: G[] }[]` — beginner → advanced, empty dropped, items by pattern.
- `type MaterialSection = 'class-helper' | 'podcast' | 'extra-notes' | 'from-lessons'`
- `materialSections(materials, lessons)` → `{ id: MaterialSection; items: MaterialItem[] }[]` where `MaterialItem = { key: string; title: string; date: Date; tags: string[]; files: { label: string; kind: string; url: string }[]; lesson?: { id: string; title: string } }`; sections in the order above, empty dropped, items newest first; `from-lessons` = one item per lesson with downloads.
- `KRDICT = { action: 'https://krdict.korean.go.kr/eng/dicMarinerSearch/search', hidden: { nation: 'eng', nationCode: '6' }, field: 'mainSearchWord' }`
- `krdictUrl(word: string): string`
- `youtubeEmbedUrl(id: string): string` → `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0`

- [ ] **Step 1: Failing tests** — `src/lib/site-logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  groupByLevel,
  groupBySeries,
  krdictUrl,
  lessonsForPattern,
  materialSections,
  neighbours,
  sortInSeries,
  youtubeEmbedUrl,
} from './site-logic';

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const lesson = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: id,
  date: d(date),
  grammar: [] as string[],
  downloads: [] as { label: string; kind: string; url: string }[],
  ...extra,
});

describe('sortInSeries', () => {
  it('orders a course by episode, unnumbered last', () => {
    const list = [
      lesson('c', '2022-01-03', { episode: 3 }),
      lesson('x', '2022-01-01'),
      lesson('a', '2022-01-05', { episode: 1 }),
    ];
    expect(sortInSeries(list, 'course').map((l) => l.id)).toEqual(['a', 'c', 'x']);
  });
  it('orders a library newest first', () => {
    const list = [lesson('old', '2021-01-01'), lesson('new', '2026-01-01')];
    expect(sortInSeries(list, 'library').map((l) => l.id)).toEqual(['new', 'old']);
  });
});

describe('groupBySeries', () => {
  const series = [
    { id: 'grammar', title: 'Grammar', kind: 'library' as const, order: 2 },
    { id: 'crash', title: 'Crash', kind: 'course' as const, order: 1 },
    { id: 'empty', title: 'Empty', kind: 'library' as const, order: 3 },
  ];
  it('keeps CMS order, drops empty series, puts loose lessons last', () => {
    const groups = groupBySeries(
      [
        lesson('g1', '2026-01-01', { series: 'grammar' }),
        lesson('c1', '2022-01-01', { series: 'crash', episode: 1 }),
        lesson('loose', '2026-02-01'),
        lesson('orphan', '2026-03-01', { series: 'deleted' }),
      ],
      series,
    );
    expect(groups.map((g) => g.series?.id ?? 'other')).toEqual(['crash', 'grammar', 'other']);
    expect(groups.at(-1)!.lessons.map((l) => l.id)).toEqual(['orphan', 'loose']);
  });
});

describe('neighbours', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  it('finds previous and next', () => {
    expect(neighbours(list, 'b')).toEqual({ prev: { id: 'a' }, next: { id: 'c' } });
  });
  it('has nothing at the ends or for a lone lesson', () => {
    expect(neighbours(list, 'a').prev).toBeUndefined();
    expect(neighbours(list, 'c').next).toBeUndefined();
    expect(neighbours([{ id: 'x' }], 'x')).toEqual({ prev: undefined, next: undefined });
  });
});

describe('lessonsForPattern', () => {
  it('lists lessons that teach a pattern, newest first', () => {
    const list = [
      lesson('old', '2021-01-01', { grammar: ['ge'] }),
      lesson('new', '2026-01-01', { grammar: ['ge', 'dorok'] }),
      lesson('other', '2026-02-01', { grammar: ['dorok'] }),
    ];
    expect(lessonsForPattern(list, 'ge').map((l) => l.id)).toEqual(['new', 'old']);
  });
});

describe('groupByLevel', () => {
  it('groups beginner to advanced and drops empty levels', () => {
    const groups = groupByLevel([
      { level: 'intermediate' as const, pattern: '-게' },
      { level: 'beginner' as const, pattern: '-고' },
      { level: 'intermediate' as const, pattern: '-도록' },
    ]);
    expect(groups.map((g) => g.level)).toEqual(['beginner', 'intermediate']);
    expect(groups[1].items.map((i) => i.pattern)).toEqual(['-게', '-도록']);
  });
});

describe('materialSections', () => {
  const file = { label: 'Worksheet', kind: 'pdf', url: 'https://x.example/a.pdf' };
  it('orders sections, drops empty ones, and adds lesson downloads', () => {
    const sections = materialSections(
      [
        {
          id: 'p1',
          title: 'Podcast 1',
          category: 'podcast',
          tags: [],
          date: d('2026-01-01'),
          files: [file],
        },
        {
          id: 'c1',
          title: 'Family',
          category: 'class-helper',
          tags: ['vocabulary'],
          date: d('2026-06-19'),
          files: [file],
        },
      ],
      [lesson('l1', '2026-03-01', { downloads: [file] }), lesson('l2', '2026-04-01')],
    );
    expect(sections.map((s) => s.id)).toEqual(['class-helper', 'podcast', 'from-lessons']);
    expect(sections.at(-1)!.items).toHaveLength(1);
    expect(sections.at(-1)!.items[0].lesson).toEqual({ id: 'l1', title: 'l1' });
  });
});

describe('urls', () => {
  it('builds a krdict search link', () => {
    expect(krdictUrl('사랑')).toBe(
      'https://krdict.korean.go.kr/eng/dicMarinerSearch/search?nation=eng&nationCode=6&mainSearchWord=%EC%82%AC%EB%9E%91',
    );
  });
  it('builds a privacy-friendly embed link', () => {
    expect(youtubeEmbedUrl('R3Ny_hDzKpc')).toBe(
      'https://www.youtube-nocookie.com/embed/R3Ny_hDzKpc?autoplay=1&rel=0',
    );
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/site-logic.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement** `src/lib/site-logic.ts`:

```ts
/** Pure helpers for the content pages: ordering, grouping and links. No Astro imports. */

export type SeriesKind = 'course' | 'library' | 'podcast';
type Dated = { title: string; date: Date; episode?: number };

const newestFirst = (a: Dated, b: Dated) =>
  b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title);

/** Course: by episode (unnumbered last), then date. Library and podcast: newest first. */
export function sortInSeries<L extends Dated>(lessons: L[], kind: SeriesKind): L[] {
  return [...lessons].sort(
    kind === 'course'
      ? (a, b) =>
          (a.episode ?? Infinity) - (b.episode ?? Infinity) || a.date.getTime() - b.date.getTime()
      : newestFirst,
  );
}

/** Series in CMS order with their lessons; lessons without a known series form a last group. */
export function groupBySeries<
  L extends Dated & { id: string; series?: string },
  S extends { id: string; title: string; kind: SeriesKind; order: number },
>(lessons: L[], series: S[]): { series?: S; lessons: L[] }[] {
  const known = new Set(series.map((s) => s.id));
  const groups: { series?: S; lessons: L[] }[] = [...series]
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .map((s) => ({
      series: s,
      lessons: sortInSeries(
        lessons.filter((l) => l.series === s.id),
        s.kind,
      ),
    }))
    .filter((g) => g.lessons.length > 0);
  const loose = lessons.filter((l) => !l.series || !known.has(l.series));
  if (loose.length > 0) groups.push({ lessons: sortInSeries(loose, 'library') });
  return groups;
}

export function neighbours<L extends { id: string }>(
  ordered: L[],
  id: string,
): { prev?: L; next?: L } {
  const i = ordered.findIndex((l) => l.id === id);
  return {
    prev: i > 0 ? ordered[i - 1] : undefined,
    next: i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : undefined,
  };
}

export function lessonsForPattern<L extends Dated & { grammar: string[] }>(
  lessons: L[],
  pattern: string,
): L[] {
  return lessons.filter((l) => l.grammar.includes(pattern)).sort(newestFirst);
}

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export function groupByLevel<G extends { level: (typeof LEVELS)[number]; pattern: string }>(
  items: G[],
): { level: G['level']; items: G[] }[] {
  return LEVELS.map((level) => ({
    level,
    items: items
      .filter((i) => i.level === level)
      .sort((a, b) => a.pattern.localeCompare(b.pattern, 'ko')),
  })).filter((g) => g.items.length > 0);
}

export type MaterialSection = 'class-helper' | 'podcast' | 'extra-notes' | 'from-lessons';
type File = { label: string; kind: string; url: string };
export type MaterialItem = {
  key: string;
  title: string;
  date: Date;
  tags: string[];
  files: File[];
  lesson?: { id: string; title: string };
};

/** Materials page sections in a fixed order; lesson downloads form "from-lessons". */
export function materialSections(
  materials: {
    id: string;
    title: string;
    category: Exclude<MaterialSection, 'from-lessons'> | string;
    tags: string[];
    date: Date;
    files: File[];
    lesson?: { id: string; title: string };
  }[],
  lessons: { id: string; title: string; date: Date; downloads: File[] }[],
): { id: MaterialSection; items: MaterialItem[] }[] {
  const byDate = (a: MaterialItem, b: MaterialItem) => b.date.getTime() - a.date.getTime();
  const own = (id: MaterialSection): MaterialItem[] =>
    materials
      .filter((m) => m.category === id)
      .map((m) => ({
        key: m.id,
        title: m.title,
        date: m.date,
        tags: m.tags,
        files: m.files,
        lesson: m.lesson,
      }))
      .sort(byDate);
  const fromLessons: MaterialItem[] = lessons
    .filter((l) => l.downloads.length > 0)
    .map((l) => ({
      key: `lesson-${l.id}`,
      title: l.title,
      date: l.date,
      tags: [],
      files: l.downloads,
      lesson: { id: l.id, title: l.title },
    }))
    .sort(byDate);
  const sections: { id: MaterialSection; items: MaterialItem[] }[] = [
    { id: 'class-helper', items: own('class-helper') },
    { id: 'podcast', items: own('podcast') },
    { id: 'extra-notes', items: own('extra-notes') },
    { id: 'from-lessons', items: fromLessons },
  ];
  return sections.filter((s) => s.items.length > 0);
}

export const KRDICT = {
  action: 'https://krdict.korean.go.kr/eng/dicMarinerSearch/search',
  hidden: { nation: 'eng', nationCode: '6' },
  field: 'mainSearchWord',
} as const;

export function krdictUrl(word: string): string {
  const params = new URLSearchParams({ ...KRDICT.hidden, [KRDICT.field]: word });
  return `${KRDICT.action}?${params}`;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}
```

- [ ] **Step 4: Run** the test file — Expected: PASS. Run `npm test` — all pass.
- [ ] **Step 5: Commit** `git add src/lib/site-logic.* && git commit -m "Site logic: series grouping and order, neighbours, grammar lookups, materials sections, krdict and embed links"`

---

### Task 2: Queries, navigation and routes

**Files:** Modify `src/content/queries.ts`, `src/components/Header.astro`, `src/components/home/{AboutHero,NewLessons,SiteContents}.astro`, `src/i18n/ui.ts`, `tests/a11y/pages.spec.ts`, `tests/ui/page-transitions.spec.ts`, `scripts/check-dist.mjs`; delete `src/pages/learn.astro`, `src/pages/ko/learn.astro`; create placeholder routes `src/pages/{grammar,practice}.astro` + `ko/` (PlaceholderView, replaced in Tasks 5 and 8) and `src/pages/lessons/index.astro` + `ko/` (PlaceholderView, replaced in Task 3).

**Interfaces — Produces (queries.ts):**

- `getSeries(): Promise<(CollectionEntry<'series'>['data'] & { id: string })[]>`
- `getGrammar(): Promise<(CollectionEntry<'grammar'>['data'] & { id: string })[]>`
- `getMaterials(): Promise<(CollectionEntry<'materials'>['data'] & { id: string; lessonEntry?: { id: string; title: string } })[]>`
- `getDecks()`, `getQuizzes()` — same pattern with `lessonEntry?: { id; title }`
- `renderBody(collection: 'lessons' | 'grammar', id: string)` → `Promise<AstroComponentFactory>` (the `Content` of `render(entry)`)
- i18n keys: `nav.lessons`, `nav.grammar`, `nav.practice`, `page.lessons.title`, `page.grammar.title`, `page.practice.title` (EN + KO); remove `nav.learn`, `nav.news`, `page.learn.title`.

- [ ] **Step 1: Failing check** — in `scripts/check-dist.mjs` add:

```js
// --- Navigation: five sections, no /learn/ ---
for (const [page, prefix] of LOCALES) {
  const nav = /<nav[^>]*aria-label="[^"]*"[^>]*>[\s\S]*?<\/nav>/.exec(read(page))?.[0] ?? '';
  for (const path of ['lessons', 'grammar', 'materials', 'practice', 'classes']) {
    if (!nav.includes(`href="${prefix}/${path}/"`)) problems.push(`${page}: nav lacks ${path}`);
  }
  if (/\/learn\//.test(read(page))) problems.push(`${page}: still links to /learn/`);
}
for (const path of ['lessons', 'grammar', 'practice']) {
  for (const prefix of ['', 'ko/']) {
    if (!exists(`${prefix}${path}/index.html`))
      problems.push(`missing ${prefix}${path}/index.html`);
  }
}
```

Run `npm run build && npm run check:dist` — Expected: FAIL (nav lacks lessons…).

- [ ] **Step 2: Implement.**
  - Header `NAV`: `lessons/nav.lessons`, `grammar/nav.grammar`, `materials/nav.materials`, `practice/nav.practice`, `classes/nav.classes`.
  - Home: `AboutHero` "Watch lessons" → `lessons`; `NewLessons` "All lessons" → `lessons`; `SiteContents` PATHS: lessons→`lessons`, materials→`materials`, practice→`practice`, speaking→`practice`, news→`news`.
  - i18n EN: `'nav.lessons': 'Lessons', 'nav.grammar': 'Grammar', 'nav.practice': 'Practice', 'page.lessons.title': 'Lessons', 'page.grammar.title': 'Grammar', 'page.practice.title': 'Practice'`; KO: `'nav.lessons': '강의', 'nav.grammar': '문법', 'nav.practice': '연습', 'page.lessons.title': '강의', 'page.grammar.title': '문법', 'page.practice.title': '연습'`. Remove `nav.learn`, `nav.news`, `page.learn.title` (keep `page.news.title`).
  - Delete both `learn.astro`; add placeholder routes (same shape as `src/pages/classes.astro`) for `lessons/index`, `grammar`, `practice` in EN and KO.
  - Tests: `/learn/` → `/lessons/` in `tests/a11y/pages.spec.ts` (both entries) and `tests/ui/page-transitions.spec.ts`; add `/grammar/`, `/practice/`, `/ko/practice/`.
  - queries.ts additions:

```ts
import { getCollection, getEntry, render, type CollectionEntry } from 'astro:content';

const withLesson = async <T extends { lesson?: string }>(data: T, from: string) => {
  if (!data.lesson) return { ...data, lessonEntry: undefined };
  const entry = await resolve('lessons', data.lesson, `${from}: lesson`);
  return { ...data, lessonEntry: { id: entry.id, title: entry.data.title } };
};

export async function getSeries() {
  return (await getCollection('series')).map((s) => ({ ...s.data, id: s.id }));
}
export async function getGrammar() {
  return (await getCollection('grammar')).map((g) => ({ ...g.data, id: g.id }));
}
export async function getMaterials() {
  return Promise.all(
    (await getCollection('materials')).map(async (m) => ({
      ...(await withLesson(m.data, `materials/${m.id}`)),
      id: m.id,
    })),
  );
}
export async function getDecks() {
  return Promise.all(
    (await getCollection('decks')).map(async (m) => ({
      ...(await withLesson(m.data, `decks/${m.id}`)),
      id: m.id,
    })),
  );
}
export async function getQuizzes() {
  return Promise.all(
    (await getCollection('quizzes')).map(async (m) => ({
      ...(await withLesson(m.data, `quizzes/${m.id}`)),
      id: m.id,
    })),
  );
}
/** Rendered Markdown body of an entry. */
export async function renderBody(collection: 'lessons' | 'grammar', id: string) {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`${collection}/${id} not found`);
  return (await render(entry)).Content;
}
```

- [ ] **Step 3: Verify** `npm test && npm run check && npm run build && npm run check:dist` — PASS. `npx playwright test tests/ui/page-transitions.spec.ts` — PASS.
- [ ] **Step 4: Commit** "Navigation: Lessons, Grammar, Materials, Practice, Classes; queries for the content pages".

---

### Task 3: Lessons library `/lessons/`

**Files:** Create `src/views/LessonsView.astro`, `src/styles/pages.css` (import in `global.css` after `home.css`); replace `src/pages/lessons/index.astro` + `ko/` with `<LessonsView lang=… />`; i18n; `scripts/check-dist.mjs`.

**Interfaces — Consumes:** `groupBySeries`, `getLessons`, `getSeries`, `youtubeThumbnail`. **Produces:** i18n `lessons.lead`, `lessons.other`, `lessons.playlist`, `lessons.episode`, `lessons.noVideo`.

- [ ] **Step 1: Failing check** (`check-dist.mjs`):

```js
// --- Lessons library: every lesson linked, grouped by series, in both languages ---
for (const [page, prefix] of [
  ['lessons/index.html', ''],
  ['ko/lessons/index.html', '/ko'],
]) {
  const html = read(page);
  for (const file of contentFiles('lessons')) {
    const id = file.replace(/\.md$/, '');
    if (!html.includes(`href="${prefix}/lessons/${id}/"`))
      problems.push(`${page}: no link to ${id}`);
  }
  if (!/<ol[^>]*class="[^"]*course-list/.test(html))
    problems.push(`${page}: course is not a numbered list`);
}
```

Expected FAIL (placeholder page).

- [ ] **Step 2: Implement** `LessonsView.astro`:

```astro
---
/** Lessons library: series in CMS order; a course as a numbered table of contents, others as a grid. */
import { Image } from 'astro:assets';
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getLessons, getSeries } from '@/content/queries';
import type { Lang } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';
import { groupBySeries } from '@/lib/site-logic';
import { youtubeThumbnail } from '@/lib/youtube';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = useTranslations(lang);
const groups = groupBySeries(await getLessons(), await getSeries());
const href = (id: string) => localizePath(lang, `lessons/${id}`);
---

<BaseLayout title={t('page.lessons.title')}>
  <div class="container-page page-head">
    <h1 class="page-title">{t('page.lessons.title')}</h1>
    <p class="page-lead">{t('lessons.lead')}</p>
  </div>
  {groups.map((g, i) => (
    <section class="container-page page-section" aria-labelledby={`series-${i}`}>
      <div class="page-section-head">
        <h2 id={`series-${i}`} class="page-section-title">
          {g.series?.title ?? t('lessons.other')}
        </h2>
        {g.series?.youtubePlaylist && (
          <a class="link" href={g.series.youtubePlaylist} target="_blank" rel="noopener noreferrer">
            {t('lessons.playlist')}
          </a>
        )}
      </div>
      {g.series?.description && <p class="page-section-lead">{g.series.description}</p>}
      {g.series?.kind === 'course' ? (
        <ol class="course-list">
          {g.lessons.map((l) => (
            <li>
              <a href={href(l.id)} class="course-link">
                <span class="course-number" aria-hidden="true">
                  {l.episode ? String(l.episode).padStart(2, '0') : '·'}
                </span>
                <span class="course-title">{l.title}</span>
                {l.summary && <span class="course-summary">{l.summary}</span>}
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <ul class="lesson-row">
          {g.lessons.map((l) => (
            <li>
              <a class="lesson-tile" href={href(l.id)}>
                {l.youtube ? (
                  <Image
                    src={youtubeThumbnail(l.youtube)}
                    alt=""
                    width={480}
                    height={270}
                    fit="cover"
                    class="lesson-thumb"
                  />
                ) : (
                  <span class="lesson-thumb lesson-thumb-empty grid-paper">
                    {t('lessons.noVideo')}
                  </span>
                )}
                <span class="lesson-title">{l.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  ))}
</BaseLayout>
```

i18n EN: `'lessons.lead': 'Every lesson from the channel, grouped the way it is on YouTube. Courses are meant to be watched in order.'`, `'lessons.other': 'Other lessons'`, `'lessons.playlist': 'Playlist on YouTube'`, `'lessons.episode': 'Episode'`, `'lessons.noVideo': 'Lesson without video'`. KO: `'강의는 유튜브 채널과 같은 방식으로 정리했어요. 코스는 순서대로 보는 걸 추천해요.'`, `'기타 강의'`, `'유튜브 재생목록'`, `'에피소드'`, `'영상 없는 강의'`.

`src/styles/pages.css` (in `@layer components`): `.page-head` (padding-block 3rem 1rem), `.page-title` (text-3xl/4xl, bold), `.page-lead` (max 60ch, muted, text-lg), `.page-section` (padding-block 2.5rem), `.page-section-head` (flex, baseline, space-between, wrap), `.page-section-title` (text-2xl bold), `.page-section-lead` (muted, max 60ch, margin .5rem 0 1.5rem), `.course-list` (ruled list like `.toc`: top 2px text border, each link grid `3rem 1fr`, number teal tabular, title semibold, summary muted spanning column 2, min-height 44px, hover title brand), `.lesson-thumb-empty` (aspect 16/9, grid centre, muted text-sm, radius 12px, border).

- [ ] **Step 3: Verify** build + check:dist PASS; visual check `/lessons/` desktop + 375px.
- [ ] **Step 4: Commit** "Lessons library: series in order, course as a numbered list, others as thumbnails".

---

### Task 4: Lesson page with video facade

**Files:** Create `src/components/VideoFacade.astro`, `tests/ui/lesson.spec.ts`; rename `src/views/LessonPlaceholderView.astro` → `src/views/LessonView.astro` (update both `[id].astro`); i18n; `pages.css`; `check-dist.mjs`; demo content: bodies for `ge-vs-dorok.md` and `korean-numbers.md`.

**Interfaces — Consumes:** `getLessons`, `getDecks`, `getQuizzes`, `renderBody`, `sortInSeries`, `neighbours`, `youtubeEmbedUrl`, `youtubeThumbnail`. **Produces:** i18n `lesson.play`, `lesson.grammar`, `lesson.files`, `lesson.practice`, `lesson.deck`, `lesson.quiz`, `lesson.series`, `lesson.prev`, `lesson.next`, `lesson.kind.pdf|audio|transcript`, `lesson.cards`, `lesson.questions`; remove `lesson.comingSoon`.

- [ ] **Step 1: Failing tests.** `check-dist.mjs`:

```js
// --- Lesson page: player only after a click, real content, links resolve ---
{
  const html = read('lessons/ge-vs-dorok/index.html');
  if (/<iframe/.test(html)) problems.push('lesson page loads a YouTube iframe before a click');
  if (!/data-video-facade/.test(html)) problems.push('lesson page has no video facade');
  if (!/href="\/grammar\/ge\/"/.test(html)) problems.push('lesson page does not link its grammar');
  if (!/class="prose"/.test(html)) problems.push('lesson body is not rendered in .prose');
  for (const [, href] of html
    .matchAll(/<main[\s\S]*?<\/main>/g)
    .next()
    .value?.[0].matchAll(/href="(\/[^"#]*)"/g) ?? []) {
    if (!exists(`${href.replace(/^\//, '')}index.html`) && !exists(href.replace(/^\//, ''))) {
      problems.push(`lesson page links to missing ${href}`);
    }
  }
  if (/data-video-facade/.test(read('lessons/korean-numbers/index.html'))) {
    problems.push('lesson without video shows a player');
  }
}
```

`tests/ui/lesson.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Never load YouTube in tests; the iframe element is what we check.
  await page.route(/youtube(-nocookie)?\.com/, (route) => route.abort());
});

test('clicking play swaps the thumbnail for a privacy-friendly player and moves focus to it', async ({
  page,
}) => {
  await page.goto('/lessons/ge-vs-dorok/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('link', { name: /play video/i }).click();
  const frame = page.locator('[data-video-facade] iframe');
  await expect(frame).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/R3Ny_hDzKpc/);
  await expect(frame).toBeFocused();
});

test('without JavaScript the play button is a link to YouTube', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/lessons/ge-vs-dorok/');
  await expect(page.getByRole('link', { name: /play video/i })).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=R3Ny_hDzKpc',
  );
  await context.close();
});

test('a course lesson links to its neighbours', async ({ page }) => {
  await page.goto('/lessons/negative-form/');
  await expect(page.getByRole('link', { name: /next/i })).toHaveAttribute(
    'href',
    '/lessons/location-particles/',
  );
});
```

Run build, check:dist, `npx playwright test tests/ui/lesson.spec.ts` — Expected FAIL.

- [ ] **Step 2: Implement.** `VideoFacade.astro`:

```astro
---
/**
 * Click-to-load YouTube player: a local thumbnail until the visitor presses play, then a
 * youtube-nocookie iframe. Without JS the button is a plain link to the video on YouTube.
 */
import { Image } from 'astro:assets';
import type { Lang } from '@/i18n/ui';
import { useTranslations } from '@/i18n/utils';
import { youtubeEmbedUrl } from '@/lib/site-logic';
import { youtubeThumbnail } from '@/lib/youtube';

interface Props {
  id: string;
  title: string;
  lang: Lang;
}
const { id, title, lang } = Astro.props;
const t = useTranslations(lang);
---

<div class="video-facade" data-video-facade data-embed={youtubeEmbedUrl(id)} data-title={title}>
  <a class="video-play" href={`https://www.youtube.com/watch?v=${id}`} data-play>
    <Image
      src={youtubeThumbnail(id)}
      alt=""
      width={960}
      height={540}
      fit="cover"
      loading="eager"
      class="video-thumb"
    />
    <span class="video-play-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path d="M8 5l11 7-11 7z" fill="currentColor" />
      </svg>
    </span>
    <span class="sr-only">
      {t('lesson.play')}: {title}
    </span>
  </a>
</div>

<script is:inline>
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-play]');
    if (!link) return;
    const box = link.closest('[data-video-facade]');
    event.preventDefault();
    const frame = document.createElement('iframe');
    frame.src = box.dataset.embed;
    frame.title = box.dataset.title;
    frame.allow =
      'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    link.replaceWith(frame);
    frame.focus();
  });
</script>
```

`LessonView.astro` (replaces placeholder):

```astro
---
/** Lesson page: player, text, grammar, files, practice, series navigation. */
import BaseLayout from '@/layouts/BaseLayout.astro';
import VideoFacade from '@/components/VideoFacade.astro';
import { getDecks, getLessons, getQuizzes, renderBody, type Lesson } from '@/content/queries';
import type { Lang, UIKey } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';
import { neighbours, sortInSeries } from '@/lib/site-logic';

interface Props {
  lang: Lang;
  lesson: Lesson;
}
const { lang, lesson } = Astro.props;
const t = useTranslations(lang);
const Body = await renderBody('lessons', lesson.id);
const all = await getLessons();
const seriesLessons = lesson.seriesEntry
  ? sortInSeries(
      all.filter((l) => l.series === lesson.series),
      lesson.seriesEntry.data.kind,
    )
  : [];
const { prev, next } = neighbours(seriesLessons, lesson.id);
const deck = (await getDecks()).find((d) => d.lessonEntry?.id === lesson.id);
const quiz = (await getQuizzes()).find((q) => q.lessonEntry?.id === lesson.id);
const href = (id: string) => localizePath(lang, `lessons/${id}`);
const kind = (k: string) => t(`lesson.kind.${k}` as UIKey);
---

<BaseLayout title={lesson.title} description={lesson.summary}>
  <div class="container-page lesson-layout">
    <article class="lesson-main">
      {lesson.youtube && <VideoFacade id={lesson.youtube} title={lesson.title} lang={lang} />}
      <header class="lesson-head">
        {lesson.seriesEntry && (
          <p class="lesson-series">
            {lesson.seriesEntry.data.title}
            {lesson.episode && ` · ${t('lessons.episode')} ${lesson.episode}`}
          </p>
        )}
        <h1 class="lesson-heading">{lesson.title}</h1>
        {lesson.summary && <p class="page-lead">{lesson.summary}</p>}
      </header>
      <div class="prose">
        <Body />
      </div>

      {lesson.grammarEntries.length > 0 && (
        <section class="lesson-block" aria-labelledby="lesson-grammar">
          <h2 id="lesson-grammar" class="lesson-block-title">
            {t('lesson.grammar')}
          </h2>
          <ul class="chip-list">
            {lesson.grammarEntries.map((g) => (
              <li>
                <a class="pattern-chip" lang="ko" href={localizePath(lang, `grammar/${g.id}`)}>
                  {g.data.pattern}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson.downloads.length > 0 && (
        <section class="lesson-block" aria-labelledby="lesson-files">
          <h2 id="lesson-files" class="lesson-block-title">
            {t('lesson.files')}
          </h2>
          <ul class="file-list">
            {lesson.downloads.map((f) => (
              <li>
                <a class="file-link" href={f.url} target="_blank" rel="noopener noreferrer">
                  <span class="file-kind">{kind(f.kind)}</span>
                  <span>{f.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(deck || quiz) && (
        <section class="lesson-block" aria-labelledby="lesson-practice">
          <h2 id="lesson-practice" class="lesson-block-title">
            {t('lesson.practice')}
          </h2>
          <ul class="file-list">
            {deck && (
              <li>
                <a class="file-link" href={`${localizePath(lang, 'practice')}#${deck.id}`}>
                  <span class="file-kind">{t('lesson.deck')}</span>
                  <span>
                    {deck.title} · {deck.cards.length} {t('lesson.cards')}
                  </span>
                </a>
              </li>
            )}
            {quiz && (
              <li>
                <a class="file-link" href={`${localizePath(lang, 'practice')}#${quiz.id}`}>
                  <span class="file-kind">{t('lesson.quiz')}</span>
                  <span>
                    {quiz.title} · {quiz.questions.length} {t('lesson.questions')}
                  </span>
                </a>
              </li>
            )}
          </ul>
        </section>
      )}

      {(prev || next) && (
        <nav class="lesson-pager" aria-label={t('lesson.series')}>
          {prev && (
            <a class="pager-link" href={href(prev.id)} rel="prev">
              <span class="pager-label">{t('lesson.prev')}</span>
              <span>{prev.title}</span>
            </a>
          )}
          {next && (
            <a class="pager-link pager-next" href={href(next.id)} rel="next">
              <span class="pager-label">{t('lesson.next')}</span>
              <span>{next.title}</span>
            </a>
          )}
        </nav>
      )}
    </article>

    {seriesLessons.length > 1 && (
      <aside class="lesson-aside" aria-labelledby="lesson-series-title">
        <h2 id="lesson-series-title" class="lesson-block-title">
          {lesson.seriesEntry!.data.title}
        </h2>
        <ol class="series-list">
          {seriesLessons.map((l) => (
            <li>
              <a href={href(l.id)} aria-current={l.id === lesson.id ? 'page' : undefined}>
                {l.title}
              </a>
            </li>
          ))}
        </ol>
      </aside>
    )}
  </div>
</BaseLayout>
```

i18n EN: `'lesson.play': 'Play video'`, `'lesson.grammar': 'Grammar in this lesson'`, `'lesson.files': 'Files'`, `'lesson.practice': 'Practice'`, `'lesson.deck': 'Flashcards'`, `'lesson.quiz': 'Quiz'`, `'lesson.series': 'Series'`, `'lesson.prev': 'Previous'`, `'lesson.next': 'Next'`, `'lesson.kind.pdf': 'PDF'`, `'lesson.kind.audio': 'Audio'`, `'lesson.kind.transcript': 'Transcript'`, `'lesson.cards': 'cards'`, `'lesson.questions': 'questions'`. KO: `'영상 재생'`, `'이 강의의 문법'`, `'자료'`, `'연습'`, `'단어 카드'`, `'퀴즈'`, `'시리즈'`, `'이전'`, `'다음'`, `'PDF'`, `'오디오'`, `'대본'`, `'장'`, `'문제'`. Remove `lesson.comingSoon`.

`pages.css`: `.lesson-layout` (grid; ≥64rem `1fr 18rem`, gap 3rem, padding-block 2rem 3rem), `.video-facade` (aspect 16/9, radius 12px, overflow hidden, background surface; `iframe` 100%/100%, border 0), `.video-play` (block, relative), `.video-thumb` (100% cover), `.video-play-icon` (absolute centre, 4.5rem circle, `bg-bg/90`-like using `color-mix(in oklab, var(--color-bg) 88%, transparent)`, color text, transition scale on hover; reduced motion: none), `.lesson-head` (margin-top 2rem), `.lesson-series` (eyebrow style: text-sm, brand, semibold), `.lesson-heading` (text-3xl bold, line-height 1.2), `.lesson-block` (margin-top 2.5rem), `.lesson-block-title` (text-lg bold, margin-bottom .75rem), `.chip-list` (flex wrap gap .5rem, no list style), `.pattern-chip` (min-height 44px, inline-flex, padding 0 1rem, border 1px border, radius 999px, font korean, hover border brand, color brand), `.file-list` (ruled list like timetable rows), `.file-link` (flex gap 1rem, min-height 44px, align centre, padding-block .5rem, border-bottom), `.file-kind` (xs uppercase bold brand, min-width 6rem), `.lesson-pager` (grid 2 cols gap 1rem margin-top 3rem), `.pager-link` (border, radius 12px, padding 1rem, grid gap .25rem; `.pager-next` text-align right, grid-column 2), `.pager-label` (xs muted uppercase), `.lesson-aside` (≥64rem sticky top 5rem, align-self start), `.series-list` (ruled, counter numbers, `a` min-height 44px block padding .5rem 0, `[aria-current]` bold brand with left teal bar).

Demo bodies — `ge-vs-dorok.md` body:

```md
Both endings mean "so that", and in many sentences you can use either. The difference is mostly
register: <span lang="ko">-게</span> is everyday speech, <span lang="ko">-도록</span> sounds more
formal and is common in instructions and writing.

## In everyday speech

<span lang="ko">잘 들리게 크게 말해 주세요.</span> — Please speak loudly so that I can hear you.

## In instructions

<span lang="ko">늦지 않도록 일찍 출발하세요.</span> — Leave early so that you are not late.

[Draft for review: JiEun's own explanation goes here.]
```

`korean-numbers.md` body: replace the draft line with two short `##` sections ("Native Korean numbers" — 하나, 둘, 셋 for counting things and age; "Sino-Korean numbers" — 일, 이, 삼 for dates, money, phone numbers) and keep `[Draft for review…]`.

- [ ] **Step 3: Verify** build, check:dist, `npx playwright test tests/ui/lesson.spec.ts` (3 passed), axe on lesson pages (`npx playwright test tests/a11y -g lessons`). Visual check desktop + 375px.
- [ ] **Step 4: Commit** "Lesson page: click-to-load player, text, grammar, files, practice links, series navigation".

---

### Task 5: Grammar reference and pattern pages

**Files:** Create `src/views/GrammarIndexView.astro`, `src/views/GrammarView.astro`, `src/pages/grammar/index.astro`, `src/pages/grammar/[id].astro` (+ `ko/`), `tests/ui/grammar.spec.ts`; delete placeholder `src/pages/grammar.astro` + `ko/`; i18n; `pages.css`; demo `src/content/grammar/go-itda.md`; `check-dist.mjs`; a11y list (`/grammar/ge/`, `/ko/grammar/ge/`).

**Interfaces — Consumes:** `getGrammar`, `getLessons`, `groupByLevel`, `lessonsForPattern`, `renderBody`. **Produces:** i18n `grammar.lead`, `grammar.search`, `grammar.searchHint`, `grammar.noResults`, `grammar.level.beginner|intermediate|advanced`, `grammar.formation`, `grammar.examples`, `grammar.compare`, `grammar.videos`, `grammar.all`.

- [ ] **Step 1: Failing tests.** check-dist:

```js
// --- Grammar: index lists every pattern; each pattern page exists in both languages ---
for (const [prefix, dir] of [
  ['', ''],
  ['/ko', 'ko/'],
]) {
  const index = read(`${dir}grammar/index.html`);
  for (const file of contentFiles('grammar')) {
    const id = file.replace(/\.md$/, '');
    if (!index.includes(`href="${prefix}/grammar/${id}/"`))
      problems.push(`${dir}grammar: no link to ${id}`);
    if (!exists(`${dir}grammar/${id}/index.html`)) problems.push(`missing ${dir}grammar/${id}/`);
  }
}
if (!/href="\/lessons\/ge-vs-dorok\/"/.test(read('grammar/ge/index.html'))) {
  problems.push('grammar/ge does not list its video lesson');
}
```

`tests/ui/grammar.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('the search narrows the list and says when nothing matches', async ({ page }) => {
  await page.goto('/grammar/');
  const search = page.getByRole('searchbox', { name: /search/i });
  await search.fill('도록');
  await expect(page.getByRole('link', { name: '-도록' })).toBeVisible();
  await expect(page.getByRole('link', { name: '-게' })).toBeHidden();
  await search.fill('zzzz');
  await expect(page.getByRole('status')).toContainText(/no patterns/i);
  await search.fill('');
  await expect(page.getByRole('link', { name: '-게' })).toBeVisible();
});

test('without JavaScript the full list shows and the search is hidden', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/grammar/');
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '-게' })).toBeVisible();
  await context.close();
});
```

Expected FAIL.

- [ ] **Step 2: Implement.** `GrammarIndexView.astro`:

```astro
---
/** Grammar reference: patterns by level with a client-side filter (the full list without JS). */
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getGrammar } from '@/content/queries';
import type { Lang, UIKey } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';
import { groupByLevel } from '@/lib/site-logic';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = useTranslations(lang);
const groups = groupByLevel(await getGrammar());
---

<BaseLayout title={t('page.grammar.title')}>
  <div class="container-page page-head">
    <h1 class="page-title">{t('page.grammar.title')}</h1>
    <p class="page-lead">{t('grammar.lead')}</p>
    <div class="grammar-search" data-grammar-search hidden>
      <label for="grammar-q" class="sr-only">
        {t('grammar.search')}
      </label>
      <input
        id="grammar-q"
        type="search"
        class="field"
        placeholder={t('grammar.searchHint')}
        autocomplete="off"
      />
      <p role="status" class="grammar-status" data-no-results={t('grammar.noResults')}></p>
    </div>
  </div>
  {groups.map((g) => (
    <section
      class="container-page page-section"
      data-grammar-group
      aria-labelledby={`level-${g.level}`}
    >
      <h2 id={`level-${g.level}`} class="page-section-title">
        {t(`grammar.level.${g.level}` as UIKey)}
      </h2>
      <ul class="pattern-list">
        {g.items.map((p) => (
          <li data-search={`${p.pattern} ${p.meaning}`.toLowerCase()}>
            <a href={localizePath(lang, `grammar/${p.id}`)} class="pattern-link">
              <span class="pattern-name" lang="ko">
                {p.pattern}
              </span>
              <span class="pattern-meaning">{p.meaning}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  ))}
  <script is:inline>
    (() => {
      const box = document.querySelector('[data-grammar-search]');
      if (!box) return;
      box.hidden = false;
      const input = box.querySelector('input');
      const status = box.querySelector('[role="status"]');
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        let total = 0;
        for (const group of document.querySelectorAll('[data-grammar-group]')) {
          let shown = 0;
          for (const li of group.querySelectorAll('[data-search]')) {
            const match = !q || li.dataset.search.includes(q);
            li.hidden = !match;
            if (match) shown += 1;
          }
          group.hidden = shown === 0;
          total += shown;
        }
        status.textContent = total === 0 ? status.dataset.noResults : '';
      });
    })();
  </script>
</BaseLayout>
```

Note: an accessible name for the list links must equal the pattern for the test's `getByRole('link', { name: '-게' })`; give the link `aria-label={p.pattern}` and keep the meaning visible (`aria-describedby` not needed). Use `aria-label` on `.pattern-link`.

`GrammarView.astro`:

```astro
---
/** Pattern page: meaning, formation, examples on grid paper, compare-with, and its video lessons. */
import BaseLayout from '@/layouts/BaseLayout.astro';
import BilingualPair from '@/components/learn/BilingualPair.astro';
import ExampleBlock from '@/components/learn/ExampleBlock.astro';
import { getGrammar, getLessons, renderBody } from '@/content/queries';
import type { Lang, UIKey } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';
import { lessonsForPattern } from '@/lib/site-logic';

type Pattern = Awaited<ReturnType<typeof getGrammar>>[number];
interface Props {
  lang: Lang;
  pattern: Pattern;
}
const { lang, pattern } = Astro.props;
const t = useTranslations(lang);
const all = await getGrammar();
const compare = pattern.compare.map((id) => all.find((g) => g.id === id)!).filter(Boolean);
const lessons = lessonsForPattern(await getLessons(), pattern.id);
const Body = await renderBody('grammar', pattern.id);
---

<BaseLayout title={pattern.pattern} description={pattern.meaning}>
  <article class="container-page grammar-page">
    <p class="lesson-series">
      <a class="link" href={localizePath(lang, 'grammar')}>
        {t('grammar.all')}
      </a>{' '}
      · {t(`grammar.level.${pattern.level}` as UIKey)}
    </p>
    <h1 class="grammar-pattern" lang="ko">
      {pattern.pattern}
    </h1>
    <p class="grammar-meaning">{pattern.meaning}</p>
    {pattern.formation && (
      <section class="lesson-block">
        <h2 class="lesson-block-title">{t('grammar.formation')}</h2>
        <p class="grammar-formation" lang="ko">
          {pattern.formation}
        </p>
      </section>
    )}
    {pattern.examples.length > 0 && (
      <section class="lesson-block">
        <h2 class="lesson-block-title">{t('grammar.examples')}</h2>
        <ExampleBlock>
          {pattern.examples.map((e) => (
            <BilingualPair ko={e.ko} translation={e.en} />
          ))}
        </ExampleBlock>
      </section>
    )}
    <div class="prose">
      <Body />
    </div>
    {compare.length > 0 && (
      <section class="lesson-block">
        <h2 class="lesson-block-title">{t('grammar.compare')}</h2>
        <ul class="chip-list">
          {compare.map((c) => (
            <li>
              <a class="pattern-chip" lang="ko" href={localizePath(lang, `grammar/${c.id}`)}>
                {c.pattern}
              </a>
            </li>
          ))}
        </ul>
      </section>
    )}
    {lessons.length > 0 && (
      <section class="lesson-block">
        <h2 class="lesson-block-title">{t('grammar.videos')}</h2>
        <ul class="file-list">
          {lessons.map((l) => (
            <li>
              <a class="file-link" href={localizePath(lang, `lessons/${l.id}`)}>
                <span>{l.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    )}
  </article>
</BaseLayout>
```

Note: the pattern heading uses plain bold Korean (`.grammar-pattern`), not `.font-display`: the serif loads only the glyphs in `DISPLAY_TEXT`.

Routes: `grammar/index.astro` → `<GrammarIndexView lang="en" />`; `grammar/[id].astro`:

```astro
---
import type { GetStaticPaths } from 'astro';
import { getGrammar } from '@/content/queries';
import GrammarView from '@/views/GrammarView.astro';

export const getStaticPaths = (async () =>
  (await getGrammar()).map((pattern) => ({
    params: { id: pattern.id },
    props: { pattern },
  }))) satisfies GetStaticPaths;
const { pattern } = Astro.props;
---

<GrammarView lang="en" pattern={pattern} />
```

(+ `ko/` with `lang="ko"`.)

i18n EN: `'grammar.lead': 'Patterns from the lessons, explained side by side. Find one by its form or meaning.'`, `'grammar.search': 'Search patterns'`, `'grammar.searchHint': 'e.g. 도록 or "so that"'`, `'grammar.noResults': 'No patterns match.'`, `'grammar.level.beginner': 'Beginner'`, `'grammar.level.intermediate': 'Intermediate'`, `'grammar.level.advanced': 'Advanced'`, `'grammar.formation': 'How it is formed'`, `'grammar.examples': 'Examples'`, `'grammar.compare': 'Compare with'`, `'grammar.videos': 'Lessons about this pattern'`, `'grammar.all': 'All grammar'`. KO: `'강의에 나온 문법을 비교하며 정리했어요. 형태나 뜻으로 찾아보세요.'`, `'문법 검색'`, `'예: 도록, "so that"'`, `'맞는 문법이 없어요.'`, `'초급'`, `'중급'`, `'고급'`, `'만드는 법'`, `'예문'`, `'비교해 보세요'`, `'이 문법을 다룬 강의'`, `'모든 문법'`.

`pages.css`: `.grammar-search` (margin-top 1.5rem, max-width 28rem; `[hidden]{display:none}`), `.grammar-status` (text-sm muted, min-height 1.5em, margin-top .5rem), `[data-grammar-group][hidden], .pattern-list li[hidden] {display:none}`, `.pattern-list` (ruled like `.toc`), `.pattern-link` (grid `minmax(8rem, 14rem) 1fr`, gap 1rem, min-height 44px, padding-block 1rem, border-bottom; phones: single column), `.pattern-name` (korean font, text-lg bold, brand), `.pattern-meaning` (muted), `.grammar-page` (padding-block 2rem 3rem, max-width 48rem), `.grammar-pattern` (font-korean, weight 700, clamp(2.5rem, 7vw, 4rem), line-height 1.1, margin .5rem 0), `.grammar-meaning` (text-xl), `.grammar-formation` (font-korean, text-lg, padding .75rem 1rem, border-left 3px teal (inset bar style like `.callout::before` is fine as plain border here)).

Demo `src/content/grammar/go-itda.md`:

```md
---
pattern: -고 있다
meaning: Be doing; an action in progress.
level: beginner
formation: Verb stem + 고 있다
examples:
  - ko: 지금 밥을 먹고 있어요.
    en: I am eating now.
  - ko: 요즘 한국어를 배우고 있어요.
    en: These days I am learning Korean.
compare: []
---
```

and add `grammar: [go-itda]` to `a-itda-vs-go-itda.md`.

- [ ] **Step 3: Verify** build, check:dist, `npx playwright test tests/ui/grammar.spec.ts` (2 passed), axe for grammar pages; visual check.
- [ ] **Step 4: Commit** "Grammar reference with search and pattern pages: examples, compare-with, video lessons".

---

### Task 6: Materials page

**Files:** Create `src/views/MaterialsView.astro`; replace `src/pages/materials.astro` + `ko/`; i18n; `pages.css`; demo `src/content/materials/podcast-winter-snacks.yml`; `check-dist.mjs`.

**Interfaces — Consumes:** `getMaterials`, `getLessons`, `materialSections`. **Produces:** i18n `materials.lead`, `materials.section.class-helper|podcast|extra-notes|from-lessons`, `materials.lesson`.

- [ ] **Step 1: Failing check:**

```js
// --- Materials: chips match sections, every file link is https, no empty section ---
for (const page of ['materials/index.html', 'ko/materials/index.html']) {
  const html = read(page);
  const chips = [
    ...html.matchAll(/<a[^>]*class="[^"]*section-chip[^"]*"[^>]*href="#([\w-]+)"/g),
  ].map((m) => m[1]);
  const sections = [...html.matchAll(/<section[^>]*id="([\w-]+)"[^>]*data-material-section/g)].map(
    (m) => m[1],
  );
  if (sections.length === 0) problems.push(`${page}: no material sections`);
  if (chips.join() !== sections.join())
    problems.push(`${page}: chips [${chips}] vs sections [${sections}]`);
  for (const [, url] of html.matchAll(/class="file-link"[^>]*href="([^"]+)"/g)) {
    if (!url.startsWith('https://')) problems.push(`${page}: file link ${url} is not https`);
  }
}
```

(Write the file anchors as `<a class="file-link" href=…>` — class before href — so the regex matches.) Expected FAIL.

- [ ] **Step 2: Implement** `MaterialsView.astro`:

```astro
---
/** Materials: anchor chips, then one ruled list per section; lesson downloads in "From lessons". */
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getLessons, getMaterials } from '@/content/queries';
import type { Lang, UIKey } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';
import { materialSections } from '@/lib/site-logic';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = useTranslations(lang);
const sections = materialSections(
  (await getMaterials()).map((m) => ({ ...m, lesson: m.lessonEntry })),
  await getLessons(),
);
const dateFormat = new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
---

<BaseLayout title={t('page.materials.title')}>
  <div class="container-page page-head">
    <h1 class="page-title">{t('page.materials.title')}</h1>
    <p class="page-lead">{t('materials.lead')}</p>
    <ul class="chip-list section-chips">
      {sections.map((s) => (
        <li>
          <a class="pattern-chip section-chip" href={`#${s.id}`}>
            {t(`materials.section.${s.id}` as UIKey)}{' '}
            <span class="chip-count">{s.items.length}</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
  {sections.map((s) => (
    <section
      id={s.id}
      data-material-section
      class="container-page page-section"
      aria-labelledby={`${s.id}-title`}
    >
      <h2 id={`${s.id}-title`} class="page-section-title">
        {t(`materials.section.${s.id}` as UIKey)}
      </h2>
      <ul class="material-list">
        {s.items.map((item) => (
          <li class="material-row">
            <div class="material-info">
              <span class="material-title">{item.title}</span>
              <span class="material-meta">
                <time datetime={item.date.toISOString().slice(0, 10)}>
                  {dateFormat.format(item.date)}
                </time>
                {item.tags.map((tag) => (
                  <span class="material-tag">{tag}</span>
                ))}
                {item.lesson && (
                  <a class="link" href={localizePath(lang, `lessons/${item.lesson.id}`)}>
                    {t('materials.lesson')}
                  </a>
                )}
              </span>
            </div>
            <ul class="material-files">
              {item.files.map((f) => (
                <li>
                  <a class="file-link" href={f.url} target="_blank" rel="noopener noreferrer">
                    <span class="file-kind">{t(`lesson.kind.${f.kind}` as UIKey)}</span>
                    <span>{f.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  ))}
</BaseLayout>
```

i18n EN: `'materials.lead': 'Worksheets, notes and transcripts to study with. Free to download.'`, `'materials.section.class-helper': 'Class Helper'`, `'materials.section.podcast': 'Podcast'`, `'materials.section.extra-notes': 'Extra notes'`, `'materials.section.from-lessons': 'From lessons'`, `'materials.lesson': 'Open the lesson'`. KO: `'공부할 때 쓰는 학습지, 노트, 대본이에요. 무료로 내려받으세요.'`, `'수업 보조 자료'`, `'팟캐스트'`, `'추가 노트'`, `'강의 자료'`, `'강의 보기'`.

`pages.css`: `.section-chips` (margin-top 1.5rem), `.chip-count` (muted, tabular), `.material-list` (ruled, top 2px text border), `.material-row` (grid; ≥48rem `1fr auto`; gap .5rem 2rem; padding-block 1rem; border-bottom), `.material-title` (semibold), `.material-meta` (flex wrap gap .25rem .75rem, text-sm muted), `.material-tag` (text-xs, padding 0 .5rem, border, radius 999px), `.material-files` (flex wrap gap .5rem; `.file-link` here: border, radius 10px, padding 0 .9rem, border-bottom none).

Demo `podcast-winter-snacks.yml`:

```yaml
title: 한국 겨울 간식 (Korean winter snacks)
category: podcast
tags: [podcast, food]
date: 2026-01-15
files:
  - label: Transcript
    kind: transcript
    url: https://files.just-korean.example/podcast/winter-snacks.pdf
```

- [ ] **Step 3: Verify** build, check:dist, axe for `/materials/`; visual check.
- [ ] **Step 4: Commit** "Materials page: sections with anchor chips, files from lessons, tags and dates".

---

### Task 7: Classes page

**Files:** Create `src/components/Timetable.astro` (table markup and `data-label`s from `ClassesTable.astro`), `src/views/ClassesView.astro`; `ClassesTable.astro` uses `Timetable`; replace `src/pages/classes.astro` + `ko/`; i18n; demo FAQ in `classes.yml`; `check-dist.mjs`.

**Interfaces — Produces:** `<Timetable lang labelledBy />` (renders `.table-scroll` + `table.timetable`); i18n `classes.lead`, `classes.faq`, `classes.contact`.

- [ ] **Step 1: Failing check:**

```js
// --- Classes page: timetable, FAQ from content, a way to book or ask ---
for (const page of ['classes/index.html', 'ko/classes/index.html']) {
  const html = read(page);
  if (!/class="timetable"/.test(html)) problems.push(`${page}: no timetable`);
  for (const item of classes.faq) {
    if (!html.includes(item.question)) problems.push(`${page}: FAQ lacks "${item.question}"`);
  }
  if ((html.match(/<details/g) ?? []).length !== classes.faq.length)
    problems.push(`${page}: FAQ count`);
}
```

Expected FAIL.

- [ ] **Step 2: Implement.** `Timetable.astro`: move the `<div class="table-scroll" …><table class="timetable">…</table></div>` block from `ClassesTable.astro` into it with props `lang: Lang; labelledBy: string`, reading `getClasses()` itself. `ClassesTable.astro` renders `<Timetable lang={lang} labelledBy="classes-title" />`.

`ClassesView.astro`:

```astro
---
/** Classes: formats timetable, FAQ, and booking (TidyCal) or contact. */
import BaseLayout from '@/layouts/BaseLayout.astro';
import Timetable from '@/components/Timetable.astro';
import { getClasses, getSite } from '@/content/queries';
import type { Lang } from '@/i18n/ui';
import { useTranslations } from '@/i18n/utils';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = useTranslations(lang);
const { faq } = await getClasses();
const site = await getSite();
---

<BaseLayout title={t('page.classes.title')}>
  <div class="container-page page-head">
    <h1 class="page-title" id="classes-page-title">
      {t('page.classes.title')}
    </h1>
    <p class="page-lead">{t('classes.lead')}</p>
  </div>
  <section class="container-page page-section" aria-labelledby="classes-page-title">
    <Timetable lang={lang} labelledBy="classes-page-title" />
    <div class="home-actions">
      {site.tidycal && (
        <a
          class="btn btn-primary"
          data-book-class
          href={site.tidycal}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('home.bookClass')}
        </a>
      )}
      {site.contactForm && (
        <a class="btn btn-ghost" href={site.contactForm} target="_blank" rel="noopener noreferrer">
          {t('classes.contact')}
        </a>
      )}
    </div>
  </section>
  {faq.length > 0 && (
    <section class="container-page page-section" aria-labelledby="faq-title">
      <h2 id="faq-title" class="page-section-title">
        {t('classes.faq')}
      </h2>
      <div class="faq-list">
        {faq.map((item) => (
          <details class="faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )}
</BaseLayout>
```

Rule for the check: when TidyCal is unset the Classes page has no booking button (the home buttons already point here); the `check:dist` booking-button rule only covers home pages — keep it so.

i18n EN: `'classes.lead': 'Live online classes with JiEun: one to one, in a small group, or in a group by level.'`, `'classes.faq': 'Questions before booking'`, `'classes.contact': 'Ask a question'`. KO: `'지은 선생님과 함께하는 온라인 수업: 1:1, 소그룹, 레벨별 그룹 수업이 있어요.'`, `'예약 전에 자주 묻는 질문'`, `'문의하기'`.

`pages.css`: `.faq-list` (top 2px text border), `.faq-item` (border-bottom; `summary` min-height 44px, flex, align centre, padding-block .75rem, semibold, cursor pointer, list-style none, `::after` "+" right muted; `[open] summary::after` "−"; `p` muted, margin 0 0 1rem, max 65ch).

Demo FAQ (`classes.yml`, comment `# Draft for review`):

```yaml
faq:
  - question: How do I know my level?
    answer: Before the first private class there is a short level test, so the lessons start at the right place.
  - question: Where do the classes take place?
    answer: Online, by video call. You only need a computer or tablet with a camera.
  - question: Can I join a group class that has already started?
    answer: Group classes follow a curriculum, so joining in the middle is limited. New groups open regularly.
  - question: Which time zone are the classes in?
    answer: The schedule changes during the year; current times are shown in the notices at the top of the site.
```

- [ ] **Step 3: Verify** build, check:dist, `npm test` (drift test unaffected), axe for classes; visual check.
- [ ] **Step 4: Commit** "Classes page: shared timetable, FAQ, booking or contact".

---

### Task 8: Practice page

**Files:** Create `src/views/PracticeView.astro`; replace placeholder `src/pages/practice.astro` + `ko/`; i18n; `pages.css`; `check-dist.mjs`.

**Interfaces — Consumes:** `getDecks`, `getQuizzes`, `KRDICT`. **Produces:** i18n `practice.lead`, `practice.decks`, `practice.quizzes`, `practice.soon`, `practice.dictionary`, `practice.dictionaryHint`, `practice.dictionaryField`, `practice.dictionaryGo`, `practice.pronunciation`, `practice.pronunciationBody`, `practice.pronunciationLink`.

- [ ] **Step 1: Failing check:**

```js
// --- Practice: decks and quizzes have anchors used by lesson pages; dictionary form targets krdict ---
for (const page of ['practice/index.html', 'ko/practice/index.html']) {
  const html = read(page);
  for (const dir of ['decks', 'quizzes']) {
    for (const file of contentFiles(dir)) {
      const id = file.replace(/\.ya?ml$/, '');
      if (!html.includes(`id="${id}"`)) problems.push(`${page}: no anchor for ${dir}/${id}`);
    }
  }
  if (
    !/<form[^>]*action="https:\/\/krdict\.korean\.go\.kr\/eng\/dicMarinerSearch\/search"/.test(html)
  ) {
    problems.push(`${page}: dictionary form does not target krdict`);
  }
  if (!/name="mainSearchWord"/.test(html)) problems.push(`${page}: dictionary field name`);
}
```

Expected FAIL.

- [ ] **Step 2: Implement** `PracticeView.astro`:

```astro
---
/** Practice: decks and quizzes (interactive versions later), krdict search, pronunciation link. */
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getDecks, getQuizzes } from '@/content/queries';
import type { Lang, UIKey } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';
import { KRDICT } from '@/lib/site-logic';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = useTranslations(lang);
const decks = await getDecks();
const quizzes = await getQuizzes();
const level = (l: string) => t(`grammar.level.${l}` as UIKey);
---

<BaseLayout title={t('page.practice.title')}>
  <div class="container-page page-head">
    <h1 class="page-title">{t('page.practice.title')}</h1>
    <p class="page-lead">{t('practice.lead')}</p>
  </div>

  <div class="container-page practice-grid">
    <section class="practice-block" aria-labelledby="decks-title">
      <h2 id="decks-title" class="page-section-title">
        {t('practice.decks')}
      </h2>
      <ul class="file-list">
        {decks.map((d) => (
          <li id={d.id} class="practice-item">
            <span class="material-title">{d.title}</span>
            <span class="material-meta">
              {level(d.level)} · {d.cards.length} {t('lesson.cards')}
              {d.lessonEntry && (
                <a class="link" href={localizePath(lang, `lessons/${d.lessonEntry.id}`)}>
                  {d.lessonEntry.title}
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p class="practice-soon">{t('practice.soon')}</p>
    </section>

    <section class="practice-block" aria-labelledby="quizzes-title">
      <h2 id="quizzes-title" class="page-section-title">
        {t('practice.quizzes')}
      </h2>
      <ul class="file-list">
        {quizzes.map((q) => (
          <li id={q.id} class="practice-item">
            <span class="material-title">{q.title}</span>
            <span class="material-meta">
              {level(q.level)} · {q.questions.length} {t('lesson.questions')}
              {q.lessonEntry && (
                <a class="link" href={localizePath(lang, `lessons/${q.lessonEntry.id}`)}>
                  {q.lessonEntry.title}
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p class="practice-soon">{t('practice.soon')}</p>
    </section>
  </div>

  <div class="container-page practice-grid">
    <section class="practice-block practice-tool grid-paper" aria-labelledby="dictionary-title">
      <h2 id="dictionary-title" class="page-section-title">
        {t('practice.dictionary')}
      </h2>
      <p class="page-section-lead">{t('practice.dictionaryHint')}</p>
      <form class="dictionary-form" action={KRDICT.action} method="get" target="_blank">
        {Object.entries(KRDICT.hidden).map(([name, value]) => (
          <input type="hidden" name={name} value={value} />
        ))}
        <label for="dict-q" class="sr-only">
          {t('practice.dictionaryField')}
        </label>
        <input
          id="dict-q"
          class="field"
          type="search"
          name={KRDICT.field}
          lang="ko"
          required
          placeholder="사랑"
        />
        <button type="submit" class="btn btn-primary">
          {t('practice.dictionaryGo')}
        </button>
      </form>
    </section>
    <section class="practice-block practice-tool" aria-labelledby="pron-title">
      <h2 id="pron-title" class="page-section-title">
        {t('practice.pronunciation')}
      </h2>
      <p class="page-section-lead">{t('practice.pronunciationBody')}</p>
      <a
        class="btn btn-ghost"
        href="https://nuri.iksi.or.kr/"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('practice.pronunciationLink')}
      </a>
    </section>
  </div>
</BaseLayout>
```

Before using the 누리-세종학당 address, open `https://nuri.iksi.or.kr/` (curl -I) and confirm it answers; if it redirects, use the final URL.

i18n EN: `'practice.lead': 'Check what you learned in the lessons. No sign-up needed.'`, `'practice.decks': 'Flashcards'`, `'practice.quizzes': 'Quizzes'`, `'practice.soon': 'Interactive practice is coming soon.'`, `'practice.dictionary': 'Dictionary'`, `'practice.dictionaryHint': 'Look up a word in the Basic Korean Dictionary of the National Institute of Korean Language, with English meanings.'`, `'practice.dictionaryField': 'Korean word'`, `'practice.dictionaryGo': 'Look up'`, `'practice.pronunciation': 'Pronunciation'`, `'practice.pronunciationBody': 'Practise the sounds of Korean with the King Sejong Institute, then watch the pronunciation lessons.'`, `'practice.pronunciationLink': 'Open pronunciation practice'`. KO: `'강의에서 배운 내용을 확인해 보세요. 가입은 필요 없어요.'`, `'단어 카드'`, `'퀴즈'`, `'곧 직접 풀어 볼 수 있어요.'`, `'사전'`, `'국립국어원 한국어기초사전에서 단어를 영어 뜻과 함께 찾아보세요.'`, `'한국어 단어'`, `'찾기'`, `'발음'`, `'세종학당 발음 연습으로 한국어 소리를 연습하고, 발음 강의도 봐 보세요.'`, `'발음 연습 열기'`.

`pages.css`: `.practice-grid` (grid; ≥48rem 2 cols; gap 2.5rem; padding-block 1.5rem), `.practice-item` (grid gap .25rem, padding-block .9rem, border-bottom; `scroll-margin-top: 5rem`; `:target` background `var(--color-teal-tint)` with padding-inline .75rem), `.practice-soon` (text-sm muted, margin-top .75rem), `.practice-tool` (padding 1.5rem, border, radius 4px), `.dictionary-form` (flex wrap gap .75rem; `.field` flex 1 1 12rem).

- [ ] **Step 3: Verify** build, check:dist, axe for practice; check `/practice/#negative-form` highlights; visual check.
- [ ] **Step 4: Commit** "Practice page: decks and quizzes listed, krdict dictionary search, pronunciation link".

---

### Task 9: Feature checklist, docs, budget, full verification

**Files:** Create `docs/features.md`; modify `CLAUDE.md`, `tests/perf/budget.spec.ts`.

- [ ] **Step 1:** `tests/perf/budget.spec.ts`: add `'/lessons/ge-vs-dorok/'` to the measured paths. Run `npm run test:browser` — must PASS (fix causes, not limits, if LCP/CLS fail; the thumbnail is `loading="eager"` and sized).
- [ ] **Step 2:** `docs/features.md` with the table from the spec's "Feature checklist", statuses updated to what was built (2, 3, 4, 5, 7, 8 → "Built: …; next: …"), a short intro ("JiEun's requested features, email 2026-10-14; update at the end of every cycle"), and a "How to check" column pointing at the URL of each.
- [ ] **Step 3:** `CLAUDE.md` Status: built pages list; link `docs/features.md`; next cycles: interactive flashcards, quizzes + Tally, news reading, Pagefind search. Decisions: `src/lib/site-logic.ts`, `src/styles/pages.css`, video facade (nocookie, no request before click), grammar filter, navigation.
- [ ] **Step 4:** Full gates: `npm test && npm run check && npm run build && npm run check:dist && npm run test:browser && npx prettier --check .` — all pass.
- [ ] **Step 5: Commit** "Feature checklist, docs, lesson page in the performance budget".
