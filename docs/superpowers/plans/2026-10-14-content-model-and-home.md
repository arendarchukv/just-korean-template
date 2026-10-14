# Content model, Pages CMS and home page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Content collections with validated schemas, a Pages CMS configuration that matches them, real demo content, and a new five-block home page (notice strip, about her, classes, site contents, new lessons).

**Architecture:** Pure zod schemas in `src/content/schemas.ts` are the single source of truth; `src/content.config.ts` wires them to glob loaders, and a unit test keeps `.pages.yml` in step with them. Pages read content only through `src/content/queries.ts` (which resolves and checks references). Pure, testable logic (YouTube ids, entry ids, notice dates, lesson selection) lives in `src/lib/`. Home blocks are separate components under `src/components/home/`.

**Tech Stack:** Astro 7.3.8 (content layer, `astro:assets`), zod 4 via `astro/zod`, Tailwind v4, Vitest, Playwright + axe, `yaml` (parse `.pages.yml` in tests), `@fontsource/gowun-batang`.

**Spec:** `docs/superpowers/specs/2026-10-14-content-model-and-home-design.md`

## Global Constraints

- Static output, zero JS by default; the only new script is a small inline one for notices.
- Components use semantic tokens only (`bg-surface`, `text-muted`, `border-border`, …), never raw hex or `brand-*`/`teal-*` utilities.
- All UI copy goes through `src/i18n/ui.ts` (EN complete, KO marked `TODO(ko-review)`); content (bio, classes, notices, lessons) is English only and comes from content files.
- Every file URL is `https://`; files live in R2; placeholder domain `files.just-korean.example`.
- Touch targets ≥ 44px; WCAG AA in both themes; visible focus.
- Performance budget stays green: LCP < 2 s, CLS < 0.1, one render-blocking CSS < 25 KB brotli, no external JS.
- Commits: small, clear messages, **no co-author trailer**.
- Windows developer: npm scripts must stay cross-platform.

## Review Focus

- A YouTube link pasted in any common form (watch?v=, youtu.be, shorts, with `&t=` or `si=`) must resolve to the id; garbage must fail with a readable message (Task 1 tests).
- A reference stored by Pages CMS as a path (`src/content/grammar/ge.md`) must still resolve (Task 1 `toEntryId` tests).
- A notice whose `to` is today must still show today; one ending yesterday must not; a dismissed notice stays hidden after reload (Task 1 + Task 5 tests).
- A lesson without a YouTube video must never appear in "New lessons" and must not break the build (Task 1 tests, Task 2 demo content includes one).
- An empty TidyCal URL must render an inert, announced-disabled button, not a broken link (Task 6 check).

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/youtube.ts` | `parseYouTubeId`, `youtubeThumbnail` |
| `src/lib/content-logic.ts` | `toEntryId`, `isNoticeActive`, `selectNotices`, `selectNewLessons` (pure) |
| `src/content/schemas.ts` | zod schemas for every collection + `download`, `level` |
| `src/content.config.ts` | collections → glob loaders + schemas |
| `src/content/queries.ts` | the only reader of content; resolves and checks references |
| `src/content/**` | demo content (Markdown / YAML) |
| `.pages.yml` | Pages CMS forms |
| `src/content/pages-config.test.ts` | `.pages.yml` ↔ schemas drift test |
| `src/components/home/NoticeStrip.astro` | notice strip + inline script |
| `src/components/home/AboutHero.astro` | about block |
| `src/components/home/ClassesTable.astro` | classes timetable |
| `src/components/home/SiteContents.astro` | 목차 list |
| `src/components/home/NewLessons.astro` | latest lessons with local thumbnails |
| `src/views/HomeView.astro` | assembles the blocks |
| `src/views/LessonPlaceholderView.astro`, `src/pages/lessons/[id].astro`, `src/pages/ko/lessons/[id].astro` | placeholder lesson route |
| `scripts/check-links.mjs` | `npm run check:links` |

---

### Task 1: Pure logic — YouTube ids, entry ids, notice dates, lesson selection

**Files:**
- Create: `src/lib/youtube.ts`, `src/lib/youtube.test.ts`, `src/lib/content-logic.ts`, `src/lib/content-logic.test.ts`

**Interfaces:**
- Produces:
  - `parseYouTubeId(input: string): string | null`
  - `youtubeThumbnail(id: string): string` → `https://i.ytimg.com/vi/<id>/hqdefault.jpg`
  - `toEntryId(value: string): string`
  - `type NoticeLike = { id: string; from: Date; to: Date; tone: 'important' | 'info' }`
  - `toDay(date: Date): string` → local `YYYY-MM-DD`
  - `isNoticeActive(n: { from: Date; to: Date }, today: string): boolean` (inclusive both ends, compared as `YYYY-MM-DD`)
  - `selectNotices<T extends NoticeLike>(notices: T[], today: string): T[]` → not yet expired (`to >= today`), important first, then by `from` ascending
  - `selectNewLessons<T extends { youtube?: string; date: Date; title: string }>(lessons: T[], count: number): T[]` → only with `youtube`, newest first, ties by title

- [ ] **Step 1: Write the failing tests**

`src/lib/youtube.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseYouTubeId, youtubeThumbnail } from './youtube';

describe('parseYouTubeId', () => {
  it.each([
    ['_lgDjyWiheU', '_lgDjyWiheU'],
    ['  R3Ny_hDzKpc  ', 'R3Ny_hDzKpc'],
    ['https://www.youtube.com/watch?v=_lgDjyWiheU', '_lgDjyWiheU'],
    ['https://www.youtube.com/watch?v=_lgDjyWiheU&t=42s&si=abc', '_lgDjyWiheU'],
    ['https://m.youtube.com/watch?v=_lgDjyWiheU', '_lgDjyWiheU'],
    ['https://youtu.be/_lgDjyWiheU?si=xyz', '_lgDjyWiheU'],
    ['https://www.youtube.com/shorts/_lgDjyWiheU', '_lgDjyWiheU'],
    ['https://www.youtube.com/embed/_lgDjyWiheU', '_lgDjyWiheU'],
  ])('reads %s', (input, id) => {
    expect(parseYouTubeId(input)).toBe(id);
  });

  it.each([
    '',
    'hello',
    'https://vimeo.com/12345678901',
    'https://www.youtube.com/@JustKorean',
    'https://www.youtube.com/playlist?list=PLciVMc5G4V70rHatPHL57LXh5GAcIdqL_',
  ])('rejects %s', (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });
});

describe('youtubeThumbnail', () => {
  it('builds the hqdefault URL', () => {
    expect(youtubeThumbnail('_lgDjyWiheU')).toBe(
      'https://i.ytimg.com/vi/_lgDjyWiheU/hqdefault.jpg',
    );
  });
});
```

`src/lib/content-logic.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isNoticeActive, selectNewLessons, selectNotices, toDay, toEntryId } from './content-logic';

const d = (s: string) => new Date(`${s}T00:00:00`);

describe('toEntryId', () => {
  it.each([
    ['ge', 'ge'],
    ['ge.md', 'ge'],
    ['src/content/grammar/ge.md', 'ge'],
    ['src\\content\\series\\crash-course.yml', 'crash-course'],
    ['content/decks/food.yaml', 'food'],
  ])('%s -> %s', (input, id) => {
    expect(toEntryId(input)).toBe(id);
  });
});

describe('notices', () => {
  const n = (id: string, from: string, to: string, tone: 'important' | 'info' = 'info') => ({
    id,
    from: d(from),
    to: d(to),
    tone,
  });

  it('formats a local day', () => {
    expect(toDay(d('2026-10-14'))).toBe('2026-10-14');
  });

  it('is active on both boundary days', () => {
    expect(isNoticeActive(n('a', '2026-10-12', '2026-12-18'), '2026-10-12')).toBe(true);
    expect(isNoticeActive(n('a', '2026-10-12', '2026-12-18'), '2026-12-18')).toBe(true);
    expect(isNoticeActive(n('a', '2026-10-12', '2026-12-18'), '2026-12-19')).toBe(false);
    expect(isNoticeActive(n('a', '2026-10-12', '2026-12-18'), '2026-10-11')).toBe(false);
  });

  it('keeps current and upcoming notices, important first', () => {
    const list = [
      n('old', '2026-01-01', '2026-10-13'),
      n('info', '2026-10-01', '2026-12-18'),
      n('soon', '2026-12-19', '2027-01-01', 'important'),
      n('now', '2026-10-10', '2026-10-20', 'important'),
    ];
    expect(selectNotices(list, '2026-10-14').map((x) => x.id)).toEqual(['now', 'soon', 'info']);
  });
});

describe('selectNewLessons', () => {
  const l = (title: string, date: string, youtube?: string) => ({ title, date: d(date), youtube });

  it('takes only video lessons, newest first, limited', () => {
    const list = [
      l('A', '2026-09-01', 'aaaaaaaaaaa'),
      l('No video', '2026-10-10'),
      l('C', '2026-10-01', 'ccccccccccc'),
      l('B', '2026-10-01', 'bbbbbbbbbbb'),
    ];
    expect(selectNewLessons(list, 2).map((x) => x.title)).toEqual(['B', 'C']);
  });

  it('returns fewer when there are not enough', () => {
    expect(selectNewLessons([l('No video', '2026-10-10')], 3)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/youtube.test.ts src/lib/content-logic.test.ts`
Expected: FAIL, cannot resolve `./youtube` / `./content-logic`.

- [ ] **Step 3: Implement**

`src/lib/youtube.ts`:

```ts
const ID = /^[\w-]{11}$/;

/** Video id from a pasted YouTube link (watch, youtu.be, shorts, embed, live) or a bare id. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/')[1] ?? '';
    return ID.test(id) ? id : null;
  }
  if (host !== 'youtube.com') return null;
  const v = url.searchParams.get('v');
  if (v && ID.test(v)) return v;
  const match = /^\/(?:shorts|embed|live)\/([\w-]{11})(?:\/|$)/.exec(url.pathname);
  return match ? match[1] : null;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
```

`src/lib/content-logic.ts`:

```ts
/** Entry id from a reference value; Pages CMS may store a path or a filename with extension. */
export function toEntryId(value: string): string {
  const last = value.replaceAll('\\', '/').split('/').pop() ?? value;
  return last.replace(/\.(md|ya?ml)$/i, '');
}

/** Local calendar day as YYYY-MM-DD. */
export function toDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isNoticeActive(n: { from: Date; to: Date }, today: string): boolean {
  return toDay(n.from) <= today && today <= toDay(n.to);
}

export type NoticeLike = { id: string; from: Date; to: Date; tone: 'important' | 'info' };

/** Notices not yet expired: important first, then the earliest start. */
export function selectNotices<T extends NoticeLike>(notices: T[], today: string): T[] {
  return notices
    .filter((n) => toDay(n.to) >= today)
    .sort(
      (a, b) =>
        Number(b.tone === 'important') - Number(a.tone === 'important') ||
        a.from.getTime() - b.from.getTime(),
    );
}

/** Latest lessons that have a YouTube video, newest first. */
export function selectNewLessons<T extends { youtube?: string; date: Date; title: string }>(
  lessons: T[],
  count: number,
): T[] {
  return lessons
    .filter((l) => l.youtube)
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title))
    .slice(0, count);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/youtube.test.ts src/lib/content-logic.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/youtube.ts src/lib/youtube.test.ts src/lib/content-logic.ts src/lib/content-logic.test.ts
git commit -m "Content logic: YouTube ids, entry ids, notice dates, new-lesson selection"
```

---

### Task 2: Schemas, collections, queries and demo content

**Files:**
- Create: `src/content/schemas.ts`, `src/content/schemas.test.ts`, `src/content.config.ts`, `src/content/queries.ts`
- Create demo content (listed in Step 5)
- Modify: `vitest.config.ts` only if `src/content/*.test.ts` is not already matched by `src/**/*.test.ts` (it is; no change expected)

**Interfaces:**
- Consumes: `parseYouTubeId`, `toEntryId` (Task 1)
- Produces (schemas.ts): `level`, `download`, `lessonSchema`, `seriesSchema`, `grammarSchema`, `materialSchema`, `deckSchema`, `quizSchema`, `noticeSchema`, `homeSchema`, `classesSchema`, `siteSchema`, and `SCHEMAS: Record<string, z.ZodObject>` keyed by collection name (`lessons`, `series`, `grammar`, `materials`, `decks`, `quizzes`, `notices`, `home`, `classes`, `site`).
- Produces (queries.ts):
  - `getLessons(): Promise<Lesson[]>` where `Lesson = CollectionEntry<'lessons'>['data'] & { id: string; seriesEntry?: CollectionEntry<'series'>; grammarEntries: CollectionEntry<'grammar'>[] }` (references resolved; `series`/`grammar` keep the raw ids)
  - `getNotices(): Promise<Notice[]>` (`Notice = { id; title; text; from; to; tone; link? }`)
  - `getHome()`, `getClasses()`, `getSite()` → parsed singleton data
  - `validateReferences(): Promise<void>` — throws `Error('<collection>/<id>: <field> "<value>" not found')`

- [ ] **Step 1: Write the failing schema test**

`src/content/schemas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { download, lessonSchema, noticeSchema } from './schemas';

describe('lessonSchema', () => {
  const base = { title: 'Korean Grammar : 게 vs 도록', date: '2026-09-23', level: 'intermediate' };

  it('normalises a YouTube link to its id', () => {
    const r = lessonSchema.parse({ ...base, youtube: 'https://youtu.be/R3Ny_hDzKpc?si=x' });
    expect(r.youtube).toBe('R3Ny_hDzKpc');
  });

  it('rejects a link that is not a YouTube video', () => {
    const r = lessonSchema.safeParse({ ...base, youtube: 'https://www.youtube.com/@JustKorean' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('YouTube');
  });

  it('allows a lesson without a video and defaults lists', () => {
    const r = lessonSchema.parse(base);
    expect(r.youtube).toBeUndefined();
    expect(r.grammar).toEqual([]);
    expect(r.downloads).toEqual([]);
  });

  it('turns stored reference paths into ids', () => {
    const r = lessonSchema.parse({
      ...base,
      series: 'src/content/series/grammar.yml',
      grammar: ['ge.md', 'dorok'],
    });
    expect(r.series).toBe('grammar');
    expect(r.grammar).toEqual(['ge', 'dorok']);
  });

  it('needs a series for an episode number', () => {
    expect(lessonSchema.safeParse({ ...base, episode: 3 }).success).toBe(false);
  });
});

describe('download', () => {
  it('requires https', () => {
    expect(
      download.safeParse({ label: 'Notes', kind: 'pdf', url: 'http://x.example/a.pdf' }).success,
    ).toBe(false);
    expect(
      download.safeParse({ label: 'Notes', kind: 'pdf', url: 'https://x.example/a.pdf' }).success,
    ).toBe(true);
  });
});

describe('noticeSchema', () => {
  it('rejects an end date before the start', () => {
    const r = noticeSchema.safeParse({
      title: 'Break',
      text: 'No classes',
      from: '2026-12-19',
      to: '2026-12-01',
      tone: 'important',
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/content/schemas.test.ts`
Expected: FAIL, cannot resolve `./schemas`.

- [ ] **Step 3: Implement `src/content/schemas.ts`**

```ts
import { z } from 'astro/zod';
import { toEntryId } from '@/lib/content-logic';
import { parseYouTubeId } from '@/lib/youtube';

/**
 * Content schemas: the single source of truth for what an entry may contain.
 * `.pages.yml` mirrors these (checked by pages-config.test.ts); messages here are what the
 * editor sees when the build rejects an entry.
 */

const httpsUrl = z.url({ protocol: /^https$/, message: 'Must be a full https:// link' });
const day = z.coerce.date();
/** A reference to another entry; Pages CMS may store a path, the site keeps only the id. */
const ref = z.string().min(1).transform(toEntryId);

export const level = z.enum(['beginner', 'intermediate', 'advanced']);

export const download = z.object({
  label: z.string().min(1),
  kind: z.enum(['pdf', 'audio', 'transcript']),
  url: httpsUrl,
});

const youtube = z.string().transform((value, ctx) => {
  const id = parseYouTubeId(value);
  if (!id) {
    ctx.addIssue({ code: 'custom', message: 'Not a YouTube video link or 11-character id' });
    return z.NEVER;
  }
  return id;
});

export const lessonSchema = z
  .object({
    title: z.string().min(1),
    youtube: youtube.optional(),
    series: ref.optional(),
    episode: z.number().int().positive().optional(),
    date: day,
    level,
    grammar: z.array(ref).default([]),
    summary: z.string().optional(),
    downloads: z.array(download).default([]),
  })
  .refine((l) => l.episode === undefined || l.series !== undefined, {
    message: 'An episode number needs a series',
    path: ['episode'],
  });

export const seriesSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  kind: z.enum(['course', 'library', 'podcast']),
  youtubePlaylist: httpsUrl.optional(),
  order: z.number().int().default(0),
});

export const grammarSchema = z.object({
  pattern: z.string().min(1),
  meaning: z.string().min(1),
  level,
  formation: z.string().optional(),
  examples: z.array(z.object({ ko: z.string().min(1), en: z.string().min(1) })).default([]),
  compare: z.array(ref).default([]),
});

export const materialSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['class-helper', 'podcast', 'extra-notes']),
  tags: z.array(z.string()).default([]),
  date: day,
  files: z.array(download).min(1),
  lesson: ref.optional(),
});

export const deckSchema = z.object({
  title: z.string().min(1),
  level,
  description: z.string().optional(),
  lesson: ref.optional(),
  cards: z
    .array(
      z.object({
        front: z.string().min(1),
        back: z.string().min(1),
        example: z.string().optional(),
      }),
    )
    .min(1),
});

export const quizSchema = z.object({
  title: z.string().min(1),
  level,
  lesson: ref.optional(),
  questions: z
    .array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('choice'),
          prompt: z.string().min(1),
          options: z
            .array(z.object({ text: z.string().min(1), correct: z.boolean().default(false) }))
            .min(2),
          explanation: z.string().optional(),
        }),
        z.object({
          type: z.literal('fill'),
          sentence: z.string().includes('___', { message: 'Mark the gap with ___' }),
          answer: z.string().min(1),
          alternatives: z.array(z.string()).default([]),
          explanation: z.string().optional(),
        }),
      ]),
    )
    .min(1),
});

export const noticeSchema = z
  .object({
    title: z.string().min(1),
    text: z.string().min(1),
    from: day,
    to: day,
    tone: z.enum(['important', 'info']),
    link: z.string().optional(),
  })
  .refine((n) => n.to >= n.from, { message: 'End date is before the start date', path: ['to'] });

export const homeSchema = z.object({
  greeting: z.string().min(1),
  intro: z.string().min(1),
  photo: httpsUrl.optional(),
  photoAlt: z.string().optional(),
  credentials: z.array(z.string().min(1)).default([]),
  newLessonsCount: z.number().int().min(1).max(6).default(3),
});

export const classesSchema = z.object({
  formats: z
    .array(z.object({ name: z.string().min(1), forWhom: z.string().min(1), how: z.string().min(1) }))
    .min(1),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).default([]),
});

const optionalUrl = z.union([httpsUrl, z.literal('')]).default('');

export const siteSchema = z.object({
  tidycal: optionalUrl,
  contactForm: optionalUrl,
  quizResultsForm: optionalUrl,
  filesBaseUrl: optionalUrl,
  social: z.object({ youtube: optionalUrl, instagram: optionalUrl, kofi: optionalUrl }),
});

/** Collection name → schema; used by content.config.ts and the .pages.yml drift test. */
export const SCHEMAS = {
  lessons: lessonSchema,
  series: seriesSchema,
  grammar: grammarSchema,
  materials: materialSchema,
  decks: deckSchema,
  quizzes: quizSchema,
  notices: noticeSchema,
  home: homeSchema,
  classes: classesSchema,
  site: siteSchema,
} as const;
```

Note: zod 4 `.refine()` on an object returns a schema whose shape is still reachable via `.def` / `._zod.def`; the drift test in Task 3 unwraps it.

- [ ] **Step 4: Run schema tests to verify they pass**

Run: `npx vitest run src/content/schemas.test.ts`
Expected: PASS. If `z.url({ protocol })` is not accepted by the installed zod 4.6, replace `httpsUrl` with `z.string().url().startsWith('https://', 'Must be a full https:// link')` and rerun.

- [ ] **Step 5: Collections and demo content**

`src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { SCHEMAS } from '@/content/schemas';

const base = './src/content';
const many = (dir: string, ext: string) => glob({ pattern: `**/*.${ext}`, base: `${base}/${dir}` });
const one = (name: string) => glob({ pattern: `${name}.yml`, base: `${base}/settings` });

export const collections = {
  lessons: defineCollection({ loader: many('lessons', 'md'), schema: SCHEMAS.lessons }),
  series: defineCollection({ loader: many('series', 'yml'), schema: SCHEMAS.series }),
  grammar: defineCollection({ loader: many('grammar', 'md'), schema: SCHEMAS.grammar }),
  materials: defineCollection({ loader: many('materials', 'yml'), schema: SCHEMAS.materials }),
  decks: defineCollection({ loader: many('decks', 'yml'), schema: SCHEMAS.decks }),
  quizzes: defineCollection({ loader: many('quizzes', 'yml'), schema: SCHEMAS.quizzes }),
  notices: defineCollection({ loader: many('notices', 'yml'), schema: SCHEMAS.notices }),
  home: defineCollection({ loader: one('home'), schema: SCHEMAS.home }),
  classes: defineCollection({ loader: one('classes'), schema: SCHEMAS.classes }),
  site: defineCollection({ loader: one('site'), schema: SCHEMAS.site }),
};
```

Demo content (real channel data; dates approximate; bio marked for review). Create each file exactly:

`src/content/series/crash-course.yml`
```yaml
title: Beginner Korean Crash Course
description: Ten short lessons that take you from the alphabet to your first conversations. Watch them in order.
kind: course
youtubePlaylist: https://www.youtube.com/playlist?list=PLciVMc5G4V73s1mfuvXEIoK2J5JKHTEkL
order: 1
```

`src/content/series/grammar.yml`
```yaml
title: Grammar
description: Patterns explained side by side, so you know which one to use and when.
kind: library
youtubePlaylist: https://www.youtube.com/playlist?list=PLciVMc5G4V70rHatPHL57LXh5GAcIdqL_
order: 2
```

`src/content/lessons/negative-form.md`
```md
---
title: Beginner Korean Intensive Course! 4. Negative Form
youtube: 1t4_UpVQIpU
series: crash-course
episode: 4
date: 2022-03-10
level: beginner
summary: How to say "not" in Korean with 안 and -지 않다.
---
```

`src/content/lessons/location-particles.md`
```md
---
title: Beginner Korean Intensive Course! 6. Location particles
youtube: TWEoRq7_sjY
series: crash-course
episode: 6
date: 2022-03-24
level: beginner
summary: 에 and 에서: where something is, and where something happens.
---
```

`src/content/lessons/eumyeon-mana-vs-a-bwatja.md`
```md
---
title: "Korean Grammar 한국어 문법 : (으)나 마나 vs 아/어 봤자"
youtube: _lgDjyWiheU
series: grammar
date: 2026-10-03
level: intermediate
grammar: [euna-mana, a-bwatja]
summary: Two ways to say "there is no point in doing it", and how they differ.
downloads:
  - label: Lesson notes
    kind: pdf
    url: https://files.just-korean.example/lessons/eumyeon-mana-vs-a-bwatja.pdf
---
```

`src/content/lessons/ge-vs-dorok.md`
```md
---
title: "Korean Grammar 한국어 문법 : 게 vs 도록"
youtube: R3Ny_hDzKpc
series: grammar
date: 2026-09-23
level: intermediate
grammar: [ge, dorok]
summary: "-게 and -도록: \"so that\" in everyday speech and in formal Korean."
---
```

`src/content/lessons/a-itda-vs-go-itda.md`
```md
---
title: "Korean Grammar 한국어 문법 : 아/어 있다 vs 고 있다"
youtube: RvBFVpgYfWQ
series: grammar
date: 2025-10-10
level: intermediate
summary: A state that continues, or an action in progress.
---
```

`src/content/lessons/korean-numbers.md` (lesson without a video)
```md
---
title: Korean numbers and how to use them
date: 2026-06-10
level: beginner
summary: Native Korean and Sino-Korean numbers, and which one to use with which counter.
downloads:
  - label: Worksheet
    kind: pdf
    url: https://files.just-korean.example/materials/korean-numbers.pdf
---

[Draft for review: lesson text to be written by JiEun.]
```

`src/content/grammar/a-bwatja.md`
```md
---
pattern: -아/어 봤자
meaning: Even if you do it, it is no use.
level: intermediate
formation: Verb stem + 아/어 봤자
examples:
  - ko: 지금 가 봤자 아무도 없을 거예요.
    en: Even if you go now, nobody will be there.
compare: [euna-mana]
---
```

`src/content/grammar/euna-mana.md`
```md
---
pattern: -(으)나 마나
meaning: Whether you do it or not, the result is the same.
level: intermediate
formation: Verb stem + (으)나 마나
examples:
  - ko: 물어보나 마나 안 된다고 할 거예요.
    en: There is no need to ask; they will say no anyway.
compare: [a-bwatja]
---
```

`src/content/grammar/ge.md`
```md
---
pattern: -게
meaning: So that; in a way that.
level: intermediate
formation: Verb or adjective stem + 게
examples:
  - ko: 잘 들리게 크게 말해 주세요.
    en: Please speak loudly so that I can hear you.
compare: [dorok]
---
```

`src/content/grammar/dorok.md`
```md
---
pattern: -도록
meaning: So that; to the point that (more formal than -게).
level: intermediate
formation: Verb stem + 도록
examples:
  - ko: 늦지 않도록 일찍 출발하세요.
    en: Leave early so that you are not late.
compare: [ge]
---
```

`src/content/notices/winter-break-2026.yml`
```yaml
title: Winter break
text: No classes from December 19 to January 1. Bookings reopen in January.
from: 2026-10-12
to: 2027-01-01
tone: important
```

`src/content/notices/spain-timetable.yml`
```yaml
title: Spain timetable
text: From October 12 to December 18 classes follow Spanish time (CET).
from: 2026-10-12
to: 2026-12-18
tone: info
link: /classes/
```

`src/content/materials/korean-family.yml`
```yaml
title: 한국의 가족 (Korean family words)
category: class-helper
tags: [vocabulary]
date: 2026-06-19
files:
  - label: Worksheet
    kind: pdf
    url: https://files.just-korean.example/materials/korean-family.pdf
```

`src/content/decks/negative-form.yml`
```yaml
title: Negative form
level: beginner
lesson: negative-form
cards:
  - front: 안 가요
    back: I don't go
  - front: 가지 않아요
    back: I don't go (more formal)
```

`src/content/quizzes/ge-vs-dorok.yml`
```yaml
title: "-게 or -도록?"
level: intermediate
lesson: ge-vs-dorok
questions:
  - type: choice
    prompt: "늦지 않___ 일찍 출발하세요."
    options:
      - text: 도록
        correct: true
      - text: 려고
    explanation: "-도록 states the purpose: so that you are not late."
  - type: fill
    sentence: "잘 들리___ 크게 말해 주세요."
    answer: 게
    alternatives: [도록]
```

`src/content/settings/home.yml`
```yaml
# Draft for review: JiEun should rewrite the greeting, intro and credentials in her own words.
greeting: Hi, I'm JiEun
intro: I teach real, everyday Korean on YouTube and in live classes. Short, clear lessons that explain not only what to say, but why.
photoAlt: JiEun, teacher of Just Korean
credentials:
  - MA in Korean Language Education
  - Certified Korean language teacher
  - Taught in Hong Kong, the Netherlands and Spain
  - 26K+ subscribers on YouTube
newLessonsCount: 3
```

`src/content/settings/classes.yml`
```yaml
formats:
  - name: 1:1 private class
    forWhom: Any level, any goal
    how: A level test first, then materials chosen for you.
  - name: Small group
    forWhom: Two or three friends who learn together
    how: A plan shaped around your group's level and goals.
  - name: Group class
    forWhom: Learners at the same level
    how: A fixed curriculum by level and topic; join when a new class opens.
faq: []
```

`src/content/settings/site.yml`
```yaml
tidycal: ''
contactForm: ''
quizResultsForm: ''
filesBaseUrl: https://files.just-korean.example
social:
  youtube: https://www.youtube.com/@JustKorean
  instagram: ''
  kofi: ''
```

- [ ] **Step 6: Implement `src/content/queries.ts`**

```ts
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/**
 * The only module that reads content. Pages never call getCollection directly, so content
 * translations (or any other change in where content comes from) can be added here later.
 */

type CollectionName = 'lessons' | 'series' | 'grammar' | 'materials' | 'decks' | 'quizzes';

async function resolve<C extends 'series' | 'grammar' | 'lessons'>(
  collection: C,
  id: string,
  from: string,
): Promise<CollectionEntry<C>> {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`${from}: ${collection} "${id}" not found`);
  return entry as CollectionEntry<C>;
}

export type Lesson = CollectionEntry<'lessons'>['data'] & {
  id: string;
  seriesEntry?: CollectionEntry<'series'>;
  grammarEntries: CollectionEntry<'grammar'>[];
};

export async function getLessons(): Promise<Lesson[]> {
  const lessons = await getCollection('lessons');
  return Promise.all(
    lessons.map(async (l) => {
      const from = `lessons/${l.id}`;
      return {
        ...l.data,
        id: l.id,
        seriesEntry: l.data.series ? await resolve('series', l.data.series, `${from}: series`) : undefined,
        grammarEntries: await Promise.all(
          l.data.grammar.map((g) => resolve('grammar', g, `${from}: grammar`)),
        ),
      };
    }),
  );
}

export async function getNotices() {
  return (await getCollection('notices')).map((n) => ({ ...n.data, id: n.id }));
}

async function single<C extends 'home' | 'classes' | 'site'>(name: C) {
  const entry = await getEntry(name, name);
  if (!entry) throw new Error(`settings/${name}.yml is missing`);
  return entry.data as CollectionEntry<C>['data'];
}

export const getHome = () => single('home');
export const getClasses = () => single('classes');
export const getSite = () => single('site');

/** Fails the build when any reference points to an entry that does not exist. */
export async function validateReferences(): Promise<void> {
  await getLessons();
  for (const g of await getCollection('grammar')) {
    for (const id of g.data.compare) await resolve('grammar', id, `grammar/${g.id}: compare`);
  }
  for (const name of ['materials', 'decks', 'quizzes'] as const satisfies CollectionName[]) {
    for (const e of await getCollection(name)) {
      if (e.data.lesson) await resolve('lessons', e.data.lesson, `${name}/${e.id}: lesson`);
    }
  }
}
```

- [ ] **Step 7: Verify the build reads everything and rejects a broken reference**

Run: `npm run check` then `npm run build`
Expected: both succeed (content synced; no page uses it yet except via Task 5+).

Then call `validateReferences()` from a throwaway check: temporarily add to the frontmatter of `src/views/HomeView.astro` the line `await (await import('@/content/queries')).validateReferences();`, change `compare: [dorok]` in `ge.md` to `compare: [dorokk]`, run `npm run build`.
Expected: build FAILS with `grammar/ge: compare: grammar "dorokk" not found`. Revert both edits (Task 5 adds the call permanently).

Also break one schema field (`level: expert` in `ge.md`), run `npm run build`, confirm the error names `grammar` → `ge` and `level`; revert.

- [ ] **Step 8: Run all unit tests and commit**

Run: `npm test`
Expected: PASS.

```bash
git add src/content src/content.config.ts
git commit -m "Content collections with validated schemas, reference checks and real demo content"
```

---

### Task 3: Pages CMS configuration and drift test

**Files:**
- Create: `.pages.yml`, `src/content/pages-config.test.ts`
- Modify: `package.json` (devDependency `yaml`)

**Interfaces:**
- Consumes: `SCHEMAS` (Task 2)

- [ ] **Step 1: Add the YAML parser**

Run: `npm install -D yaml`

- [ ] **Step 2: Write the failing drift test**

`src/content/pages-config.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { SCHEMAS } from './schemas';

type Field = {
  name: string;
  type?: string;
  component?: string;
  fields?: Field[];
  blocks?: { name: string; fields?: Field[]; component?: string }[];
  blockKey?: string;
};
type Entry = { name: string; type: string; path: string; fields: Field[] };

const config = parse(readFileSync('.pages.yml', 'utf8')) as {
  components?: Record<string, Omit<Field, 'name'>>;
  content: Entry[];
};

/** Field with its component expanded (field keys win, as in Pages CMS). */
function expand(field: Field): Field {
  if (!field.component) return field;
  const component = config.components?.[field.component];
  if (!component) throw new Error(`unknown component ${field.component}`);
  return { ...component, ...field } as Field;
}

/** Strip optional/default/array/pipe/refine wrappers down to the object or union inside. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function core(schema: any): any {
  for (;;) {
    const def = schema._zod.def;
    if (['optional', 'nullable', 'default', 'prefault'].includes(def.type)) schema = def.innerType;
    else if (def.type === 'array') schema = def.element;
    else if (def.type === 'pipe') schema = def.in;
    else return schema;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compare(fields: Field[], schema: any, where: string) {
  const obj = core(schema);
  expect(obj._zod.def.type, `${where} is an object`).toBe('object');
  const shape = obj._zod.def.shape;
  const cms = fields.map(expand).filter((f) => f.name !== 'body');
  expect(cms.map((f) => f.name).sort(), `${where} fields`).toEqual(Object.keys(shape).sort());
  for (const f of cms) {
    if (f.fields) compare(f.fields, shape[f.name], `${where}.${f.name}`);
    if (f.blocks) {
      const union = core(shape[f.name]);
      for (const block of f.blocks) {
        const option = union._zod.def.options.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (o: any) => o._zod.def.shape[f.blockKey ?? '_block']._zod.def.values.includes(block.name),
        );
        expect(option, `${where}.${f.name} block ${block.name}`).toBeDefined();
        const blockFields = expand(block as Field).fields ?? [];
        compare(
          [...blockFields, { name: f.blockKey ?? '_block' }],
          option,
          `${where}.${f.name}.${block.name}`,
        );
      }
    }
  }
}

describe('.pages.yml', () => {
  it('has a form for every collection and nothing else', () => {
    expect(config.content.map((e) => e.name).sort()).toEqual(Object.keys(SCHEMAS).sort());
  });

  for (const entry of config.content) {
    it(`${entry.name} form matches its schema`, () => {
      compare(entry.fields, SCHEMAS[entry.name as keyof typeof SCHEMAS], entry.name);
    });
  }

  it('every field has a hint for the editor', () => {
    const missing: string[] = [];
    const walk = (fields: Field[], where: string) => {
      for (const raw of fields) {
        const f = expand(raw) as Field & { description?: string };
        if (!f.description) missing.push(`${where}.${f.name}`);
        if (f.fields) walk(f.fields, `${where}.${f.name}`);
        for (const b of f.blocks ?? []) walk(expand(b as Field).fields ?? [], `${where}.${b.name}`);
      }
    };
    for (const e of config.content) walk(e.fields, e.name);
    expect(missing).toEqual([]);
  });

  it('collections point at the folders the site loads', () => {
    for (const e of config.content) {
      const expected = ['home', 'classes', 'site'].includes(e.name)
        ? `src/content/settings/${e.name}.yml`
        : `src/content/${e.name}`;
      expect(e.path, e.name).toBe(expected);
    }
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run src/content/pages-config.test.ts`
Expected: FAIL, ENOENT `.pages.yml`.

- [ ] **Step 4: Write `.pages.yml`**

```yaml
# Pages CMS forms. Keep in step with src/content/schemas.ts (checked by pages-config.test.ts).
# Files (PDF, audio, photos) live in Cloudflare R2: upload there, paste the public link here.

components:
  level:
    type: select
    label: Level
    description: Who the content is for.
    options:
      values:
        - { name: beginner, label: Beginner }
        - { name: intermediate, label: Intermediate }
        - { name: advanced, label: Advanced }
  download:
    type: object
    label: File
    description: Upload the file to R2 in the Cloudflare dashboard, then paste its public link.
    fields:
      - name: label
        type: string
        required: true
        description: What students see, e.g. "Lesson notes" or "Transcript".
      - name: kind
        type: select
        required: true
        description: Shown as a small label next to the download button.
        options:
          values:
            - { name: pdf, label: PDF }
            - { name: audio, label: Audio }
            - { name: transcript, label: Transcript }
      - name: url
        type: string
        required: true
        description: Full https:// link to the file in R2.
        pattern:
          regex: '^https://'
          message: The link must start with https://

content:
  - name: lessons
    label: Lessons
    type: collection
    path: src/content/lessons
    format: yaml-frontmatter
    filename: { template: '{primary}.md', field: create }
    view:
      fields: [title, date, series]
      primary: title
      search: [title, summary]
      sort: [date, title]
      default: { sort: date, order: desc }
    fields:
      - name: title
        type: string
        required: true
        description: The lesson title, as on YouTube.
      - name: youtube
        type: string
        description: Paste the YouTube link (or the 11-character video id). Leave empty for a lesson without a video.
      - name: series
        type: reference
        description: The playlist or series this lesson belongs to.
        options: { collection: series, search: title, value: '{name}', label: '{title}' }
      - name: episode
        type: number
        description: Position in an ordered series (course). Leave empty otherwise.
      - name: date
        type: date
        required: true
        description: Publication date; the home page shows the newest lessons first.
        options: { format: yyyy-MM-dd }
      - name: level
        component: level
        required: true
      - name: grammar
        type: reference
        description: Grammar patterns explained in this lesson.
        options: { collection: grammar, multiple: true, search: pattern, value: '{name}', label: '{pattern}' }
      - name: summary
        type: text
        description: One or two sentences for cards and search results.
      - name: downloads
        component: download
        label: Files
        description: Files for this lesson (notes, transcript, audio). Upload to R2 first.
        list: { collapsible: { collapsed: true, summary: '{label}' } }
      - name: body
        type: rich-text
        label: Lesson text
        description: Explanation or transcript shown on the lesson page.

  - name: series
    label: Series
    type: collection
    path: src/content/series
    format: yaml
    filename: { template: '{primary}.yml', field: create }
    view: { fields: [title, kind, order], primary: title, default: { sort: order, order: asc } }
    fields:
      - name: title
        type: string
        required: true
        description: Series name, e.g. "Beginner Korean Crash Course".
      - name: description
        type: text
        description: One or two sentences about the series.
      - name: kind
        type: select
        required: true
        description: Course = watch in order (shows progress). Library = any order. Podcast = episodes.
        options:
          values:
            - { name: course, label: Course (in order) }
            - { name: library, label: Library }
            - { name: podcast, label: Podcast }
      - name: youtubePlaylist
        type: string
        description: Link to the YouTube playlist (optional).
      - name: order
        type: number
        description: Display order on the site; smaller numbers come first.

  - name: grammar
    label: Grammar
    type: collection
    path: src/content/grammar
    format: yaml-frontmatter
    filename: { template: '{primary}.md', field: create }
    view: { fields: [pattern, meaning, level], primary: pattern, search: [pattern, meaning] }
    fields:
      - name: pattern
        type: string
        required: true
        description: The pattern as students search for it, e.g. "-아/어 봤자".
      - name: meaning
        type: string
        required: true
        description: Meaning in one short English line.
      - name: level
        component: level
        required: true
      - name: formation
        type: text
        description: How the pattern is formed, e.g. "Verb stem + 아/어 봤자".
      - name: examples
        type: object
        description: Example sentences with a translation.
        list: { collapsible: { collapsed: true, summary: '{ko}' } }
        fields:
          - name: ko
            type: string
            required: true
            description: Example in Korean.
          - name: en
            type: string
            required: true
            description: English translation.
      - name: compare
        type: reference
        description: Similar patterns students confuse with this one.
        options: { collection: grammar, multiple: true, search: pattern, value: '{name}', label: '{pattern}' }
      - name: body
        type: rich-text
        label: Notes
        description: Longer explanation (optional).

  - name: materials
    label: Materials
    type: collection
    path: src/content/materials
    format: yaml
    filename: { template: '{primary}.yml', field: create }
    view:
      fields: [title, category, date]
      primary: title
      search: [title, tags]
      default: { sort: date, order: desc }
    fields:
      - name: title
        type: string
        required: true
        description: Title students see in the materials list.
      - name: category
        type: select
        required: true
        description: Section of the materials page.
        options:
          values:
            - { name: class-helper, label: Class Helper }
            - { name: podcast, label: Podcast }
            - { name: extra-notes, label: Extra Notes }
      - name: tags
        type: string
        list: true
        description: Short topics for filtering, e.g. "vocabulary", "reading".
      - name: date
        type: date
        required: true
        description: Date the material was added.
        options: { format: yyyy-MM-dd }
      - name: files
        component: download
        label: Files
        description: One or more files. Upload to R2 first, then paste the links.
        list: { min: 1, collapsible: { collapsed: true, summary: '{label}' } }
      - name: lesson
        type: reference
        description: Lesson this material belongs to (optional).
        options: { collection: lessons, search: title, value: '{name}', label: '{title}' }

  - name: decks
    label: Flashcards
    type: collection
    path: src/content/decks
    format: yaml
    filename: { template: '{primary}.yml', field: create }
    view: { fields: [title, level], primary: title, search: [title] }
    fields:
      - name: title
        type: string
        required: true
        description: Deck name, e.g. "Food and snacks".
      - name: level
        component: level
        required: true
      - name: description
        type: text
        description: One sentence about the deck (optional).
      - name: lesson
        type: reference
        description: Lesson or podcast episode this deck goes with (optional).
        options: { collection: lessons, search: title, value: '{name}', label: '{title}' }
      - name: cards
        type: object
        description: The cards. Korean on the front, meaning on the back.
        list: { min: 1, collapsible: { collapsed: true, summary: '{front}' } }
        fields:
          - name: front
            type: string
            required: true
            description: Korean word or phrase.
          - name: back
            type: string
            required: true
            description: Meaning.
          - name: example
            type: string
            description: Example sentence (optional).

  - name: quizzes
    label: Quizzes
    type: collection
    path: src/content/quizzes
    format: yaml
    filename: { template: '{primary}.yml', field: create }
    view: { fields: [title, level], primary: title, search: [title] }
    fields:
      - name: title
        type: string
        required: true
        description: Quiz title.
      - name: level
        component: level
        required: true
      - name: lesson
        type: reference
        description: Lesson this quiz checks (optional).
        options: { collection: lessons, search: title, value: '{name}', label: '{title}' }
      - name: questions
        type: block
        description: Add questions; each can be multiple choice or fill in the gap.
        list: true
        blockKey: type
        blocks:
          - name: choice
            label: Multiple choice
            fields:
              - name: prompt
                type: string
                required: true
                description: The question or sentence.
              - name: options
                type: object
                description: Answer options; tick the correct one.
                list: { min: 2 }
                fields:
                  - name: text
                    type: string
                    required: true
                    description: Option text.
                  - name: correct
                    type: boolean
                    description: Tick if this option is correct.
              - name: explanation
                type: text
                description: Shown after answering (optional).
          - name: fill
            label: Fill in the gap
            fields:
              - name: sentence
                type: string
                required: true
                description: Sentence with the gap written as ___ (three underscores).
              - name: answer
                type: string
                required: true
                description: The correct answer.
              - name: alternatives
                type: string
                list: true
                description: Other accepted answers (optional).
              - name: explanation
                type: text
                description: Shown after answering (optional).

  - name: notices
    label: Notices
    type: collection
    path: src/content/notices
    format: yaml
    filename: { template: '{primary}.yml', field: create }
    view: { fields: [title, from, to, tone], primary: title, default: { sort: from, order: desc } }
    fields:
      - name: title
        type: string
        required: true
        description: Short headline, e.g. "Winter break".
      - name: text
        type: text
        required: true
        description: One line shown in the strip at the top of the site.
      - name: from
        type: date
        required: true
        description: First day the notice is shown.
        options: { format: yyyy-MM-dd }
      - name: to
        type: date
        required: true
        description: Last day the notice is shown; it disappears automatically after this day.
        options: { format: yyyy-MM-dd }
      - name: tone
        type: select
        required: true
        description: Important notices come first and stand out more.
        options:
          values:
            - { name: important, label: Important }
            - { name: info, label: Info }
      - name: link
        type: string
        description: Optional link for "Details", e.g. /classes/ or a full https:// link.

  - name: home
    label: Home page
    type: file
    path: src/content/settings/home.yml
    format: yaml
    fields:
      - name: greeting
        type: string
        required: true
        description: First line of the about block, e.g. "Hi, I'm JiEun".
      - name: intro
        type: text
        required: true
        description: Two sentences about you and how you teach.
      - name: photo
        type: string
        description: Your photo: upload to R2, paste the https:// link. A paper shape shows until set.
      - name: photoAlt
        type: string
        description: Short description of the photo for screen readers.
      - name: credentials
        type: string
        list: true
        description: Short facts students trust, one per line (degree, experience, subscribers).
      - name: newLessonsCount
        type: number
        description: How many new lessons the home page shows (1 to 6).

  - name: classes
    label: Classes
    type: file
    path: src/content/settings/classes.yml
    format: yaml
    fields:
      - name: formats
        type: object
        description: Class formats, shown on the home page and the Classes page.
        list: { min: 1, collapsible: { collapsed: true, summary: '{name}' } }
        fields:
          - name: name
            type: string
            required: true
            description: Format name, e.g. "1:1 private class".
          - name: forWhom
            type: string
            required: true
            description: Who it suits, in a few words.
          - name: how
            type: text
            required: true
            description: How it works, in one sentence.
      - name: faq
        type: object
        description: Questions students ask before booking.
        list: { collapsible: { collapsed: true, summary: '{question}' } }
        fields:
          - name: question
            type: string
            required: true
            description: The question.
          - name: answer
            type: text
            required: true
            description: The answer.

  - name: site
    label: Site settings
    type: file
    path: src/content/settings/site.yml
    format: yaml
    fields:
      - name: tidycal
        type: string
        description: Your TidyCal booking link; "Book a class" buttons open it.
      - name: contactForm
        type: string
        description: Tally contact form link.
      - name: quizResultsForm
        type: string
        description: Tally form that receives quiz results.
      - name: filesBaseUrl
        type: string
        description: Public address of the R2 bucket, e.g. https://files.example.com.
      - name: social
        type: object
        description: Links in the footer. Leave empty to hide.
        fields:
          - name: youtube
            type: string
            description: YouTube channel link.
          - name: instagram
            type: string
            description: Instagram profile link.
          - name: kofi
            type: string
            description: Ko-fi page link.
```

- [ ] **Step 5: Run the drift test**

Run: `npx vitest run src/content/pages-config.test.ts`
Expected: PASS. If a field mismatch is reported, fix whichever side is wrong against the spec (the schema is the source of truth for names).

- [ ] **Step 6: Prove the test catches drift**

Rename `forWhom` to `audience` in `.pages.yml`, run the test, expect FAIL naming `classes.formats fields`; revert.

- [ ] **Step 7: Commit**

```bash
git add .pages.yml src/content/pages-config.test.ts package.json package-lock.json
git commit -m "Pages CMS forms for every collection, with hints; test keeps them in step with the schemas"
```

---

### Task 4: Footer and settings read from `site.yml`

**Files:**
- Modify: `src/components/Footer.astro`, `src/config.ts`, `scripts/check-dist.mjs`

**Interfaces:**
- Consumes: `getSite()` (Task 2)

- [ ] **Step 1: Write the failing dist check**

Append to `scripts/check-dist.mjs` before the final report:

```js
// --- Footer links come from settings/site.yml: the YouTube link is set in demo content ---
for (const page of ['index.html', 'ko/index.html']) {
  const footer = /<footer[\s\S]*<\/footer>/.exec(read(page))?.[0] ?? '';
  if (!footer.includes('href="https://www.youtube.com/@JustKorean"')) {
    problems.push(`${page}: footer YouTube link does not come from site settings`);
  }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run check:dist`
Expected: FAIL with "footer YouTube link does not come from site settings".

- [ ] **Step 3: Implement**

In `src/components/Footer.astro` replace the `SOCIAL_LINKS` import and the `LINKS` list:

```astro
---
import Logo from '@/components/Logo.astro';
import { SITE } from '@/config';
import { getSite } from '@/content/queries';
import type { Lang, UIKey } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const t = useTranslations(lang);
const site = await getSite();

const LINKS: { href: string; label: UIKey }[] = [
  { href: site.social.youtube, label: 'footer.youtube' },
  { href: site.social.instagram, label: 'footer.instagram' },
  { href: site.contactForm, label: 'footer.contact' },
  { href: site.social.kofi, label: 'footer.kofi' },
];

const year = new Date().getFullYear();
---
```

and in the markup change the map to `{LINKS.map(({ href, label }) => { const external = href.startsWith('http'); return ( ... ); })}` keeping the existing `<li><a …>` body unchanged.

In `src/config.ts` delete `SOCIAL_LINKS` and `SocialKey` (keep `SITE`). Run `npx astro check` to confirm nothing else imports them.

- [ ] **Step 4: Verify**

Run: `npm run build && npm run check:dist`
Expected: `dist check passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.astro src/config.ts scripts/check-dist.mjs
git commit -m "Footer links come from site settings (editable in Pages CMS)"
```

---

### Task 5: Serif display font, notice strip, new HomeView skeleton

**Files:**
- Modify: `package.json` (`@fontsource/gowun-batang`), `src/styles/theme.css`, `src/layouts/BaseLayout.astro`, `src/styles/signature.css`, `src/i18n/ui.ts`, `src/views/HomeView.astro`, `scripts/check-dist.mjs`
- Create: `src/components/home/NoticeStrip.astro`, `tests/ui/notices.spec.ts`

**Interfaces:**
- Consumes: `getNotices`, `validateReferences` (Task 2), `selectNotices`, `toDay` (Task 1)
- Produces: CSS `--font-display` token and `.font-display` utility; `.notice-strip` styles; HomeView with `<NoticeStrip>` and slots for later blocks; i18n keys `notice.details`, `notice.dismiss`, `notice.label`

- [ ] **Step 1: Write the failing checks**

Append to `scripts/check-dist.mjs`:

```js
// --- Home: notice strip carries dates so the browser can hide expired notices ---
for (const page of ['index.html', 'ko/index.html']) {
  const html = read(page);
  const notices = [...html.matchAll(/<li[^>]*data-notice="([^"]+)"[^>]*>/g)];
  if (notices.length === 0) problems.push(`${page}: no notices rendered`);
  for (const [tag, id] of notices) {
    if (!/data-from="\d{4}-\d{2}-\d{2}"/.test(tag) || !/data-to="\d{4}-\d{2}-\d{2}"/.test(tag)) {
      problems.push(`${page}: notice ${id} lacks data-from/data-to`);
    }
  }
}
```

`tests/ui/notices.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'notice behaviour is checked on desktop');
});

const strip = (page: import('@playwright/test').Page) => page.getByRole('region', { name: /notice/i });

test('shows notices active today and hides expired ones', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-20T10:00:00'));
  await page.goto('/');
  // Spain timetable ended on 2026-12-18; the winter break runs to 2027-01-01.
  await expect(strip(page).getByText('Winter break')).toBeVisible();
  await expect(strip(page).getByText('Spain timetable')).toBeHidden();
});

test('the last day of a notice still shows it', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-18T23:00:00'));
  await page.goto('/');
  await expect(strip(page).getByText('Spain timetable')).toBeVisible();
});

test('a dismissed notice stays hidden after reload', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T10:00:00'));
  await page.goto('/');
  const item = strip(page).getByRole('listitem').filter({ hasText: 'Winter break' });
  await item.getByRole('button', { name: /dismiss/i }).click();
  await expect(item).toBeHidden();
  await page.reload();
  await expect(strip(page).getByText('Winter break')).toBeHidden();
  await expect(strip(page).getByText('Spain timetable')).toBeVisible();
});

test('without JavaScript, notices active at build time still show', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByText('Winter break')).toBeVisible();
  await context.close();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run build && npm run check:dist`
Expected: FAIL "no notices rendered".
Run: `npx playwright test tests/ui/notices.spec.ts --project=desktop`
Expected: FAIL (no notice region).

- [ ] **Step 3: Font**

Run: `npm install @fontsource/gowun-batang`

Inspect `node_modules/@fontsource/gowun-batang/700.css` and confirm it is split into `unicode-range` slices (Korean subsets numbered `[0]`…`[n]`). If it is, the browser downloads only the slices that contain the glyphs used. If it is not split, stop and report: the file would be too heavy for the budget.

In `src/styles/theme.css`, next to `--font-sans` / `--font-korean`, add:

```css
  --font-display: 'Gowun Batang', 'Noto Serif KR', 'Batang', serif;
```

In `src/layouts/BaseLayout.astro` add after the Pretendard import:

```ts
import '@fontsource/gowun-batang/700.css';
```

In `src/styles/signature.css` (inside the existing `@layer components` block) add:

```css
  /* Second voice: Korean serif (명조) for a few display lines only. */
  .font-display {
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: -0.01em;
    word-break: keep-all;
  }
```

- [ ] **Step 4: Notice strip component**

i18n keys in `src/i18n/ui.ts` (EN, then KO in the `ko` object):

```ts
  'notice.label': 'Notices',
  'notice.details': 'Details',
  'notice.dismiss': 'Dismiss notice',
```

```ts
  'notice.label': '공지',
  'notice.details': '자세히',
  'notice.dismiss': '공지 닫기',
```

`src/components/home/NoticeStrip.astro`:

```astro
---
import { getNotices } from '@/content/queries';
import { isNoticeActive, selectNotices, toDay } from '@/lib/content-logic';
import type { Lang } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';

/**
 * Strip of paper tape above the page with current notices. Rendered at build with every
 * not-yet-expired notice; the inline script re-checks the dates in the visitor's browser,
 * so a notice appears and disappears on its days without a rebuild. Dismissed notices are
 * remembered per id. At most two notices show at once.
 */
interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const t = useTranslations(lang);
const buildDay = toDay(new Date());
const notices = selectNotices(await getNotices(), buildDay);
const MAX = 2;
const formatter = new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-GB', {
  day: 'numeric',
  month: 'short',
});
const href = (link: string) =>
  link.startsWith('http') ? link : localizePath(lang, link.replace(/^\/|\/$/g, ''));
let shown = 0;
---

{
  notices.length > 0 && (
    <section class="notice-strip" aria-label={t('notice.label')} data-print="hide">
      <ul class="container-page" data-notice-list>
        {notices.map((n) => {
          const visible = isNoticeActive(n, buildDay) && shown++ < MAX;
          return (
            <li
              data-notice={n.id}
              data-from={toDay(n.from)}
              data-to={toDay(n.to)}
              data-tone={n.tone}
              hidden={!visible}
            >
              <span class="notice-dates">
                {formatter.format(n.from)} – {formatter.format(n.to)}
              </span>
              <p>
                <strong>{n.title}.</strong> {n.text}
                {n.link && (
                  <>
                    {' '}
                    <a class="link" href={href(n.link)}>
                      {t('notice.details')}
                    </a>
                  </>
                )}
              </p>
              <button type="button" class="icon-btn" data-dismiss aria-label={t('notice.dismiss')}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  )
}

<script is:inline define:vars={{ MAX }}>
  (() => {
    const list = document.querySelector('[data-notice-list]');
    if (!list) return;
    const KEY = 'dismissed-notices';
    let dismissed = [];
    try {
      dismissed = JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {}
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const update = () => {
      let shown = 0;
      for (const li of list.querySelectorAll('[data-notice]')) {
        const active = li.dataset.from <= today && today <= li.dataset.to;
        const show = active && !dismissed.includes(li.dataset.notice) && shown < MAX;
        li.hidden = !show;
        if (show) shown += 1;
      }
      list.closest('section').hidden = shown === 0;
    };
    list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dismiss]');
      if (!button) return;
      dismissed.push(button.closest('[data-notice]').dataset.notice);
      try {
        localStorage.setItem(KEY, JSON.stringify(dismissed));
      } catch {}
      update();
    });
    update();
  })();
</script>
```

Styles in `src/styles/signature.css`:

```css
  /* Notice strip: a band of paper tape, not a card. */
  .notice-strip {
    border-bottom: 1px solid var(--color-border);
    background:
      repeating-linear-gradient(
        -45deg,
        transparent 0 6px,
        color-mix(in oklab, var(--color-brand) 7%, transparent) 6px 7px
      ),
      var(--color-surface);
  }
  .notice-strip ul {
    display: grid;
    gap: 0;
    padding-block: 0.25rem;
  }
  .notice-strip li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 1rem;
    padding-block: 0.5rem;
  }
  .notice-strip li + li {
    border-top: 1px dashed var(--color-border);
  }
  .notice-strip li[hidden] {
    display: none;
  }
  .notice-strip p {
    flex: 1 1 18rem;
    margin: 0;
    font-size: var(--text-sm);
  }
  .notice-dates {
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }
  .notice-strip li[data-tone='important'] .notice-dates {
    color: var(--color-brand-strong);
  }
```

If `var(--text-sm)` / `var(--text-xs)` are not the names theme.css uses for the type scale, use the names it defines (check `src/styles/theme.css`). If `color-mix` breaks the contrast test (`npm test`), use `var(--color-brand-tint)` as the band colour.

- [ ] **Step 5: New HomeView skeleton**

Replace `src/views/HomeView.astro` with:

```astro
---
/** Home page, shared by `/` and `/ko/`. Content comes from src/content; copy from i18n. */
import BaseLayout from '@/layouts/BaseLayout.astro';
import NoticeStrip from '@/components/home/NoticeStrip.astro';
import { validateReferences } from '@/content/queries';
import type { Lang } from '@/i18n/ui';

interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
// The home page always builds, so this is where broken references stop the build.
await validateReferences();
---

<BaseLayout>
  <NoticeStrip lang={lang} slot="before-main" />
  <div class="home"></div>
</BaseLayout>
```

The notice strip must sit directly under the header, above `<main>`. Check `BaseLayout.astro`: if it has no named slot before `<main>`, add `<slot name="before-main" />` between `<Header …/>` and `<main …>`. Remove from `src/i18n/ui.ts` the keys only the old home used (`home.eyebrow`, `home.title`, `home.lead`, `home.ctaStart`, `home.ctaClasses`, `home.featuresTitle`, `home.feature.*`) in both languages, and delete the "Home feature cards" block (4 linked cards) in `scripts/check-dist.mjs`. Run `npx astro check` to find leftovers.

- [ ] **Step 6: Verify**

Run: `npm test && npm run build && npm run check:dist`
Expected: PASS.
Run: `npx playwright test tests/ui/notices.spec.ts --project=desktop`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add -A src package.json package-lock.json scripts tests/ui/notices.spec.ts
git commit -m "Home: notice strip that follows its dates in the browser; Korean serif display font"
```

---

### Task 6: About block and classes timetable

**Files:**
- Create: `src/components/home/AboutHero.astro`, `src/components/home/ClassesTable.astro`
- Modify: `src/views/HomeView.astro`, `src/i18n/ui.ts`, `src/styles/signature.css`, `scripts/check-dist.mjs`

**Interfaces:**
- Consumes: `getHome`, `getClasses`, `getSite` (Task 2); `Collage` (`src/components/shapes/Collage.astro`, `variant="hero"`)
- Produces: i18n keys `home.bookClass`, `home.watchLessons`, `home.classes.title`, `home.classes.format`, `home.classes.forWhom`, `home.classes.how`, `home.classes.more`

- [ ] **Step 1: Write the failing dist checks**

Append to `scripts/check-dist.mjs`:

```js
// --- Home blocks appear in order ---
const HOME_BLOCKS = ['notices', 'about', 'classes', 'contents', 'new-lessons'];
for (const page of ['index.html', 'ko/index.html']) {
  const html = read(page);
  const found = [...html.matchAll(/data-home-block="([\w-]+)"/g)].map((m) => m[1]);
  const expected = HOME_BLOCKS.filter((b) => b === 'notices' || found.includes(b));
  if (found.join() !== expected.join()) {
    problems.push(`${page}: home blocks out of order: ${found.join(', ')}`);
  }
}

// --- About: one h1 containing the Korean serif title; booking button is inert while unset ---
for (const page of ['index.html', 'ko/index.html']) {
  const html = read(page);
  const h1s = [...html.matchAll(/<h1[\s\S]*?<\/h1>/g)].map((m) => m[0]);
  if (h1s.length !== 1) problems.push(`${page}: ${h1s.length} h1 elements`);
  if (!/lang="ko"[^>]*class="[^"]*font-display/.test(h1s[0] ?? '')) {
    problems.push(`${page}: h1 lacks the Korean display title`);
  }
  const book = /<a[^>]*data-book-class[^>]*>/.exec(html)?.[0] ?? '';
  if (!book) problems.push(`${page}: no Book a class button`);
  else if (/href="#"/.test(book) && !/aria-disabled="true"/.test(book)) {
    problems.push(`${page}: empty TidyCal link is not marked disabled`);
  }
}

// --- Classes: a real table with headers, rows from settings/classes.yml ---
{
  const table = /<section[^>]*data-home-block="classes"[\s\S]*?<\/section>/.exec(read('index.html'))?.[0] ?? '';
  if ((table.match(/<th scope="col"/g) ?? []).length < 3) problems.push('classes table lacks column headers');
  if (!table.includes('1:1 private class')) problems.push('classes table does not read classes.yml');
}
```

Mark the notice strip `<section>` in `NoticeStrip.astro` with `data-home-block="notices"`.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run check:dist`
Expected: FAIL (no h1, no Book a class button, classes table missing).

- [ ] **Step 3: i18n keys**

EN:

```ts
  'home.bookClass': 'Book a class',
  'home.watchLessons': 'Watch lessons',
  'home.credentials': 'About the teacher',
  'home.classes.title': 'Classes',
  'home.classes.format': 'Format',
  'home.classes.forWhom': 'For whom',
  'home.classes.how': 'How it works',
  'home.classes.more': 'Classes, prices and FAQ',
```

KO:

```ts
  'home.bookClass': '수업 예약',
  'home.watchLessons': '강의 보기',
  'home.credentials': '선생님 소개',
  'home.classes.title': '수업',
  'home.classes.format': '수업 형태',
  'home.classes.forWhom': '대상',
  'home.classes.how': '진행 방식',
  'home.classes.more': '수업 안내와 자주 묻는 질문',
```

- [ ] **Step 4: AboutHero**

`src/components/home/AboutHero.astro`:

```astro
---
import { Image } from 'astro:assets';
import Collage from '@/components/shapes/Collage.astro';
import { SITE } from '@/config';
import { getHome, getSite } from '@/content/queries';
import type { Lang } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';

/** Who she is and what she does: Korean serif title, two sentences, credentials, two actions. */
interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const t = useTranslations(lang);
const home = await getHome();
const site = await getSite();
const booking = site.tidycal;
---

<section class="container-page about-hero" data-home-block="about" aria-labelledby="about-title">
  <div class="about-text">
    <h1 id="about-title">
      <span lang="ko" class="font-display about-title-ko">{SITE.nameKo}</span>
      <span class="about-greeting">{home.greeting}</span>
    </h1>
    <p class="about-intro">{home.intro}</p>
    <div class="about-actions">
      <a
        class="btn btn-primary"
        data-book-class
        href={booking || '#'}
        aria-disabled={booking ? undefined : 'true'}
        target={booking ? '_blank' : undefined}
        rel={booking ? 'noopener noreferrer' : undefined}
      >
        {t('home.bookClass')}
      </a>
      <a class="btn btn-ghost" href={localizePath(lang, 'learn')}>{t('home.watchLessons')}</a>
    </div>
  </div>

  <div class="about-side">
    {
      home.photo ? (
        <Image
          src={home.photo}
          alt={home.photoAlt ?? ''}
          width={560}
          height={640}
          class="about-photo"
          loading="eager"
        />
      ) : (
        <Collage variant="hero" class="about-photo-placeholder" />
      )
    }
    {
      home.credentials.length > 0 && (
        <div class="about-credentials grid-paper">
          <h2 class="sr-only">{t('home.credentials')}</h2>
          <ul>
            {home.credentials.map((c) => (
              <li>{c}</li>
            ))}
          </ul>
        </div>
      )
    }
  </div>
</section>
```

Styles (`src/styles/signature.css`, components layer):

```css
  /* About block: asymmetric, text first on small screens. */
  .about-hero {
    display: grid;
    gap: 2.5rem;
    padding-block: 3.5rem 3rem;
    align-items: center;
  }
  @media (min-width: 48rem) {
    .about-hero {
      grid-template-columns: 1.2fr 1fr;
      padding-block: 5rem 4rem;
    }
  }
  .about-hero h1 {
    display: grid;
    gap: 0.75rem;
    margin: 0;
  }
  .about-title-ko {
    font-size: clamp(3rem, 9vw, 5.5rem);
    line-height: 1;
    color: var(--color-text);
  }
  .about-greeting {
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--color-brand-strong);
  }
  .about-intro {
    margin: 1.5rem 0 0;
    max-width: 38ch;
    font-size: var(--text-lg);
    line-height: 1.6;
    color: var(--color-muted);
  }
  .about-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 2rem;
  }
  .about-side {
    position: relative;
    display: grid;
    gap: 1.25rem;
  }
  /* Photo cut out by an organic shape (same blob as the eyebrow mark), not a rounded box. */
  .about-photo {
    width: 100%;
    height: auto;
    aspect-ratio: 7 / 8;
    object-fit: cover;
    mask: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M8 14C20 2 52 0 74 6S99 30 97 56 84 96 56 98 6 92 3 64 -4 26 8 14Z"/></svg>')
      center / 100% 100% no-repeat;
  }
  .about-credentials {
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1rem 1.25rem;
    background-color: var(--color-bg);
  }
  .about-credentials ul {
    display: grid;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
  }
  .about-credentials li::before {
    content: '— ';
    color: var(--color-teal-strong);
  }
```

- [ ] **Step 5: ClassesTable**

`src/components/home/ClassesTable.astro`:

```astro
---
import { getClasses, getSite } from '@/content/queries';
import type { Lang } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';

/** Class formats as a ruled timetable: one row per format, read from settings/classes.yml. */
interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const t = useTranslations(lang);
const { formats } = await getClasses();
const booking = (await getSite()).tidycal;
---

<section class="container-page home-section" data-home-block="classes" aria-labelledby="classes-title">
  <h2 id="classes-title" class="home-section-title">{t('home.classes.title')}</h2>
  <div class="table-scroll" tabindex="0">
    <table class="timetable">
      <thead>
        <tr>
          <th scope="col">{t('home.classes.format')}</th>
          <th scope="col">{t('home.classes.forWhom')}</th>
          <th scope="col">{t('home.classes.how')}</th>
        </tr>
      </thead>
      <tbody>
        {
          formats.map((f) => (
            <tr>
              <th scope="row">{f.name}</th>
              <td>{f.forWhom}</td>
              <td>{f.how}</td>
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
  <div class="about-actions">
    <a
      class="btn btn-primary"
      href={booking || '#'}
      aria-disabled={booking ? undefined : 'true'}
      target={booking ? '_blank' : undefined}
      rel={booking ? 'noopener noreferrer' : undefined}
    >
      {t('home.bookClass')}
    </a>
    <a class="btn btn-link" href={localizePath(lang, 'classes')}>{t('home.classes.more')}</a>
  </div>
</section>
```

Styles:

```css
  .home-section {
    padding-block: 3rem;
  }
  .home-section-title {
    margin: 0 0 1.5rem;
    font-size: var(--text-2xl);
    font-weight: 700;
  }
  /* Timetable: ruled lines, no boxes, like a printed class schedule. */
  .timetable {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-base);
  }
  .timetable th,
  .timetable td {
    padding: 1rem 1rem 1rem 0;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: top;
    min-width: 10em;
  }
  .timetable thead th {
    padding-block: 0.5rem;
    border-bottom: 2px solid var(--color-text);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .timetable tbody th {
    font-weight: 600;
  }
  .timetable td {
    color: var(--color-muted);
  }
```

- [ ] **Step 6: Wire into HomeView**

In `src/views/HomeView.astro` import both components and replace `<div class="home"></div>` with:

```astro
  <AboutHero lang={lang} />
  <ClassesTable lang={lang} />
```

- [ ] **Step 7: Verify**

Run: `npm test && npm run build && npm run check:dist`
Expected: PASS. Then `npx astro dev --background`, open `/` and `/ko/` at desktop and 375px width, in both themes; confirm the serif title, photo placeholder, credentials on grid paper, the table and inert booking button look right. Fix visual issues before committing.

- [ ] **Step 8: Commit**

```bash
git add src scripts
git commit -m "Home: about block with Korean serif title and credentials; classes as a ruled timetable"
```

---

### Task 7: Site contents (목차), new lessons with local thumbnails, lesson placeholder route

**Files:**
- Create: `src/components/home/SiteContents.astro`, `src/components/home/NewLessons.astro`, `src/views/LessonPlaceholderView.astro`, `src/pages/lessons/[id].astro`, `src/pages/ko/lessons/[id].astro`
- Modify: `astro.config.mjs` (`image.domains`), `src/views/HomeView.astro`, `src/i18n/ui.ts`, `src/styles/signature.css`, `scripts/check-dist.mjs`, `tests/a11y/pages.spec.ts`

**Interfaces:**
- Consumes: `getLessons`, `getHome` (Task 2); `selectNewLessons` (Task 1); `youtubeThumbnail` (Task 1)
- Produces: route `/lessons/<id>/` and `/ko/lessons/<id>/` for every lesson

- [ ] **Step 1: Write the failing checks**

Append to `scripts/check-dist.mjs`:

```js
// --- 목차: five numbered sections, links stay in the locale ---
for (const [page, prefix] of [['index.html', ''], ['ko/index.html', '/ko']]) {
  const block = /<section[^>]*data-home-block="contents"[\s\S]*?<\/section>/.exec(read(page))?.[0] ?? '';
  const links = [...block.matchAll(/<a[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  if (links.length !== 5) problems.push(`${page}: site contents has ${links.length} links, expected 5`);
  if (links.some((h) => !h.startsWith(`${prefix}/`))) problems.push(`${page}: contents leave the locale`);
}

// --- New lessons: local optimised thumbnails, links to existing lesson pages ---
for (const [page, prefix] of [['index.html', ''], ['ko/index.html', '/ko']]) {
  const block = /<section[^>]*data-home-block="new-lessons"[\s\S]*?<\/section>/.exec(read(page))?.[0] ?? '';
  const imgs = [...block.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  if (imgs.length !== 3) problems.push(`${page}: ${imgs.length} new-lesson thumbnails, expected 3`);
  for (const img of imgs) {
    if (/i\.ytimg\.com/.test(img)) problems.push(`${page}: thumbnail loads from YouTube`);
    if (!/width="\d+"/.test(img) || !/height="\d+"/.test(img)) problems.push(`${page}: thumbnail without size`);
  }
  for (const [, href] of block.matchAll(/<a[^>]*href="([^"]+)"/g)) {
    if (!href.startsWith(`${prefix}/lessons/`)) continue;
    const file = `${href.replace(/^\//, '')}index.html`;
    if (!exists(file)) problems.push(`${page}: new lesson links to missing ${href}`);
  }
  if (/korean-numbers/.test(block)) problems.push(`${page}: a lesson without video is in New lessons`);
}
```

Add to `PAGES` in `tests/a11y/pages.spec.ts`: `'/lessons/ge-vs-dorok/'`, `'/ko/lessons/ge-vs-dorok/'`, `'/lessons/korean-numbers/'`.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run check:dist`
Expected: FAIL (contents and new lessons missing).

- [ ] **Step 3: i18n keys**

EN:

```ts
  'home.contents.title': 'On this site',
  'home.contents.lessons.title': 'Lessons and grammar',
  'home.contents.lessons.body': 'Every video from the channel in order, with a grammar reference.',
  'home.contents.materials.title': 'Materials',
  'home.contents.materials.body': 'Worksheets, notes and transcripts to download.',
  'home.contents.practice.title': 'Flashcards and quizzes',
  'home.contents.practice.body': 'Check what you learned, at your own pace.',
  'home.contents.speaking.title': 'Pronunciation and dictionary',
  'home.contents.speaking.body': 'Sounds of Korean, and a quick way to look up a word.',
  'home.contents.news.title': 'Korean news reading',
  'home.contents.news.body': 'Real news in Korean, with words to learn.',
  'home.newLessons.title': 'New lessons',
  'home.newLessons.all': 'All lessons',
  'lesson.watchOnYouTube': 'Watch on YouTube',
  'lesson.comingSoon': 'The full lesson page is being built.',
```

KO:

```ts
  'home.contents.title': '이 사이트에서',
  'home.contents.lessons.title': '강의와 문법',
  'home.contents.lessons.body': '채널의 모든 영상을 순서대로, 문법 사전과 함께.',
  'home.contents.materials.title': '자료',
  'home.contents.materials.body': '학습지, 노트, 대본을 내려받아요.',
  'home.contents.practice.title': '단어 카드와 퀴즈',
  'home.contents.practice.body': '배운 내용을 내 속도로 확인해요.',
  'home.contents.speaking.title': '발음과 사전',
  'home.contents.speaking.body': '한국어 소리, 그리고 단어를 빠르게 찾는 방법.',
  'home.contents.news.title': '한국어 뉴스 읽기',
  'home.contents.news.body': '배울 단어와 함께 읽는 진짜 한국어 뉴스.',
  'home.newLessons.title': '새 강의',
  'home.newLessons.all': '모든 강의',
  'lesson.watchOnYouTube': '유튜브에서 보기',
  'lesson.comingSoon': '강의 페이지를 준비하고 있어요.',
```

- [ ] **Step 4: SiteContents**

`src/components/home/SiteContents.astro`:

```astro
---
import type { Lang, UIKey } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';

/**
 * 목차: the site's sections as a textbook table of contents. Sections that are not built yet
 * point at their placeholder pages; update `path` when a section lands.
 */
interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const t = useTranslations(lang);

const ITEMS: { key: string; term: string; path: string }[] = [
  { key: 'lessons', term: '강의', path: 'learn' },
  { key: 'materials', term: '자료', path: 'materials' },
  { key: 'practice', term: '연습', path: 'learn' },
  { key: 'speaking', term: '발음 · 사전', path: 'learn' },
  { key: 'news', term: '뉴스', path: 'news' },
];
const k = (item: string, part: 'title' | 'body') => `home.contents.${item}.${part}` as UIKey;
---

<section class="container-page home-section" data-home-block="contents" aria-labelledby="contents-title">
  <h2 id="contents-title" class="home-section-title">{t('home.contents.title')}</h2>
  <ol class="toc">
    {
      ITEMS.map((item, i) => (
        <li>
          <a href={localizePath(lang, item.path)} class="toc-link">
            <span class="toc-number" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span class="toc-body">
              <span class="toc-title">
                {lang !== 'ko' && (
                  <span lang="ko" class="toc-term font-display">
                    {item.term}
                  </span>
                )}
                {t(k(item.key, 'title'))}
              </span>
              <span class="toc-text">{t(k(item.key, 'body'))}</span>
            </span>
            <span class="toc-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      ))
    }
  </ol>
</section>
```

Styles:

```css
  /* 목차: numbered contents with leader lines, no boxes. */
  .toc {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--color-border);
  }
  .toc-link {
    display: grid;
    grid-template-columns: 3rem 1fr auto;
    gap: 1rem;
    align-items: baseline;
    min-height: 44px;
    padding-block: 1.1rem;
    border-bottom: 1px solid var(--color-border);
    color: inherit;
    text-decoration: none;
  }
  .toc-number {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--color-teal-strong);
  }
  .toc-body {
    display: grid;
    gap: 0.25rem;
  }
  .toc-title {
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .toc-term {
    margin-right: 0.6rem;
    color: var(--color-brand-strong);
  }
  .toc-text {
    color: var(--color-muted);
  }
  .toc-arrow {
    color: var(--color-muted);
    transition: transform 0.2s ease;
  }
  .toc-link:hover .toc-title {
    color: var(--color-brand-strong);
  }
  .toc-link:hover .toc-arrow {
    transform: translateX(4px);
    color: var(--color-brand-strong);
  }
```

Add `.toc-arrow` to the existing reduced-motion block (`transition: none`).

- [ ] **Step 5: Allow YouTube thumbnails and render NewLessons**

In `astro.config.mjs` add to `defineConfig({...})`:

```js
  image: {
    // YouTube thumbnails are fetched at build and served as local WebP. Add the R2 domain
    // here once known, for her photo.
    domains: ['i.ytimg.com'],
  },
```

`src/components/home/NewLessons.astro`:

```astro
---
import { Image } from 'astro:assets';
import { getHome, getLessons } from '@/content/queries';
import { selectNewLessons } from '@/lib/content-logic';
import { youtubeThumbnail } from '@/lib/youtube';
import type { Lang } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';

/** Latest lessons with a video: thumbnails fetched and optimised at build (no requests to Google). */
interface Props {
  lang: Lang;
}

const { lang } = Astro.props;
const t = useTranslations(lang);
const { newLessonsCount } = await getHome();
const lessons = selectNewLessons(await getLessons(), newLessonsCount);
const dateFormat = new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
---

{
  lessons.length > 0 && (
    <section class="container-page home-section" data-home-block="new-lessons" aria-labelledby="new-lessons-title">
      <div class="home-section-head">
        <h2 id="new-lessons-title" class="home-section-title">
          {t('home.newLessons.title')}
        </h2>
        <a class="link" href={localizePath(lang, 'learn')}>
          {t('home.newLessons.all')}
        </a>
      </div>
      <ul class="lesson-row">
        {lessons.map((l) => (
          <li>
            <a class="lesson-tile" href={localizePath(lang, `lessons/${l.id}`)}>
              <Image
                src={youtubeThumbnail(l.youtube!)}
                alt=""
                width={480}
                height={270}
                fit="cover"
                class="lesson-thumb"
              />
              <span class="lesson-meta">
                {l.seriesEntry?.data.title}
                {l.seriesEntry && ' · '}
                <time datetime={l.date.toISOString().slice(0, 10)}>{dateFormat.format(l.date)}</time>
              </span>
              <span class="lesson-title">{l.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

Styles:

```css
  .home-section-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem 1rem;
  }
  .lesson-row {
    display: grid;
    gap: 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 40rem) {
    .lesson-row {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .lesson-tile {
    display: grid;
    gap: 0.6rem;
    color: inherit;
    text-decoration: none;
  }
  .lesson-thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 12px;
    background: var(--color-surface);
  }
  .lesson-meta {
    font-size: var(--text-xs);
    color: var(--color-muted);
  }
  .lesson-title {
    font-weight: 600;
    line-height: 1.35;
  }
  .lesson-tile:hover .lesson-title {
    color: var(--color-brand-strong);
  }
```

- [ ] **Step 6: Lesson placeholder route**

`src/views/LessonPlaceholderView.astro`:

```astro
---
/** Minimal lesson page until the real one is built: title, summary, link to the video. */
import BaseLayout from '@/layouts/BaseLayout.astro';
import type { Lesson } from '@/content/queries';
import type { Lang } from '@/i18n/ui';
import { localizePath, useTranslations } from '@/i18n/utils';

interface Props {
  lang: Lang;
  lesson: Lesson;
}

const { lang, lesson } = Astro.props;
const t = useTranslations(lang);
---

<BaseLayout title={lesson.title} description={lesson.summary}>
  <section class="container-page home-section">
    {lesson.seriesEntry && <p class="eyebrow mb-4">{lesson.seriesEntry.data.title}</p>}
    <h1 class="text-3xl font-bold">{lesson.title}</h1>
    {lesson.summary && <p class="mt-4 max-w-2xl text-lg text-muted">{lesson.summary}</p>}
    <p class="mt-6 text-muted">{t('lesson.comingSoon')}</p>
    <div class="about-actions">
      {
        lesson.youtube && (
          <a
            class="btn btn-primary"
            href={`https://www.youtube.com/watch?v=${lesson.youtube}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('lesson.watchOnYouTube')}
          </a>
        )
      }
      <a class="btn btn-ghost" href={localizePath(lang, '')}>{t('placeholder.backHome')}</a>
    </div>
  </section>
</BaseLayout>
```

`src/pages/lessons/[id].astro`:

```astro
---
import type { GetStaticPaths } from 'astro';
import { getLessons } from '@/content/queries';
import LessonPlaceholderView from '@/views/LessonPlaceholderView.astro';

export const getStaticPaths = (async () =>
  (await getLessons()).map((lesson) => ({ params: { id: lesson.id }, props: { lesson } }))) satisfies GetStaticPaths;

const { lesson } = Astro.props;
---

<LessonPlaceholderView lang="en" lesson={lesson} />
```

`src/pages/ko/lessons/[id].astro`: identical, with `lang="ko"`.

- [ ] **Step 7: Wire into HomeView**

After `<ClassesTable lang={lang} />` add:

```astro
  <SiteContents lang={lang} />
  <NewLessons lang={lang} />
```

with the matching imports.

- [ ] **Step 8: Verify**

Run: `npm test && npm run check && npm run build && npm run check:dist`
Expected: PASS.
Run: `npm run test:browser`
Expected: all pass, including a11y for the lesson pages and the perf budget. If the perf test fails on the font-file limit (`fontFilesOnEnglishHome`), read the measured number in the report; if extra files are the serif slices for "그냥 한국어" and the 목차 terms (expected 2–6 small files), raise the limit in `tests/perf/budget.spec.ts` to the measured count and update its baseline comment; if LCP or CLS fails, fix the cause (e.g. `font-display`, image sizes) instead.
Then check `/` and `/ko/` in the dev server at desktop and 375px, both themes.

- [ ] **Step 9: Commit**

```bash
git add -A src astro.config.mjs scripts tests
git commit -m "Home: site contents as a 목차, new lessons with local thumbnails, lesson placeholder pages"
```

---

### Task 8: `npm run check:links` and project notes

**Files:**
- Create: `scripts/check-links.mjs`
- Modify: `package.json` (script), `CLAUDE.md`

- [ ] **Step 1: Write the script**

`scripts/check-links.mjs`:

```js
// Checks that every file link in content (R2 downloads, her photo) answers. Run before deploy.
// Placeholder links on the .example domain are skipped.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../src/content/', import.meta.url);
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(md|ya?ml)$/.test(name)) files.push(path);
  }
};
walk(root.pathname.replace(/^\/(\w:)/, '$1'));

const links = new Map();
for (const file of files) {
  for (const [, url] of readFileSync(file, 'utf8').matchAll(/(?:url|photo):\s*['"]?(https:\/\/[^\s'"]+)/g)) {
    if (/\.example(\/|$)/.test(new URL(url).hostname + '/')) continue;
    links.set(url, file);
  }
}

const dead = [];
await Promise.all(
  [...links].map(async ([url, file]) => {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (!res.ok) dead.push(`${res.status} ${url} (${file})`);
    } catch (error) {
      dead.push(`${error.message} ${url} (${file})`);
    }
  }),
);

if (dead.length) {
  console.error(`dead file links:\n- ${dead.join('\n- ')}`);
  process.exit(1);
}
console.log(`file links ok (${links.size} checked)`);
```

Add to `package.json` scripts: `"check:links": "node scripts/check-links.mjs"`.

- [ ] **Step 2: Verify it skips placeholders and catches a dead link**

Run: `npm run check:links`
Expected: `file links ok (0 checked)`.
Temporarily set the `korean-family.yml` file URL to `https://httpbin.org/status/404`, run again, expect exit 1 listing it; revert.

- [ ] **Step 3: Update `CLAUDE.md`**

In "Status": replace "Work is paused until the content direction is known…" paragraph with a short note that the content direction is set (lesson-centred library on her channel; spec `docs/superpowers/specs/2026-10-14-content-model-and-home-design.md`), list the next cycles from the spec's "Out of scope", and move "Content direction" out of "Waiting on the owner" (add: her photo, bio wording, TidyCal/Tally URLs, R2 public domain). Replace the "Planned information architecture" section's opening line to point at the spec as the current model. Add under "Decisions": content lives in `src/content/` (schemas in `src/content/schemas.ts`, read only through `src/content/queries.ts`), `.pages.yml` mirrors the schemas (test), files are R2 links checked by `npm run check:links`, content is single-language (UI only is translated).

- [ ] **Step 4: Full verification**

Run: `npm test && npm run check && npm run build && npm run check:dist && npm run test:browser`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-links.mjs package.json CLAUDE.md
git commit -m "check:links for R2 file links; CLAUDE.md records the content model and next cycles"
```
