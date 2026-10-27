import { z } from 'astro/zod';
import { PLAYLIST_IDS } from '../data/playlists';
import { parseYouTubeId } from '../lib/youtube';
import { TALLY_FORM } from '../lib/site-logic';
import { HOLIDAY_IDS } from '../data/holidays';

/**
 * Content schemas: the single source of truth for what an entry may contain.
 * `.pages.yml` mirrors these (checked by pages-config.test.ts); messages here are what the
 * editor sees when the build rejects an entry.
 */

const httpsUrl = z.url({ protocol: /^https$/, message: 'Must be a full https:// link' });
const day = z.coerce.date();

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

/** One word: the same shape inside a lesson and in a separate deck. */
export const word = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  example: z.string().optional(),
});

/** One quiz question: the same shape inside a lesson and in a separate quiz. */
export const question = z.discriminatedUnion('type', [
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
]);

/** One part of a lesson's reading text: Korean, with an optional English translation. */
export const storyPart = z.object({
  title: z.string().optional(),
  text: z.string().trim().min(1, { message: 'Write the Korean text of this part' }),
  translation: z.string().optional(),
});

/**
 * A lesson is a container: besides the video and text it may carry a cover image, a reading text,
 * its own words, quiz and files. Nothing points to another form; the playlist comes from a fixed
 * list in code. The cover is an image in the repository (`src/assets/lessons/`, uploaded in Pages
 * CMS), so content.config.ts passes Astro's `image()`, which checks and optimises it; elsewhere
 * (tests, the .pages.yml check) it is the path as written.
 */
/**
 * The page address of a lesson, deck or quiz, typed in Pages CMS; the file is named after it
 * (`.pages.yml` filename `{fields.address}`). Small Latin letters, digits, single dashes: Pages CMS
 * drops Korean letters from file names, so a title cannot be used. Optional here because the site
 * uses the file name; the CMS form requires it.
 */
export const pageAddress = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export function makeLessonSchema<Cover extends z.ZodType>(cover: Cover) {
  return z.object({
    address: pageAddress.optional(),
    title: z.string().min(1),
    youtube: youtube.optional(),
    cover: cover.optional(),
    playlist: z.enum(PLAYLIST_IDS).optional(),
    date: day,
    level,
    summary: z.string().optional(),
    story: z.array(storyPart).default([]),
    /** Grammar patterns as typed, e.g. "-게"; the grammar page is built from them. */
    grammar: z.array(z.string().trim().min(1)).default([]),
    words: z.array(word).default([]),
    quiz: z.array(question).default([]),
    files: z.array(download).default([]),
  });
}
export const lessonSchema = makeLessonSchema(z.string());

export const materialSchema = z.object({
  title: z.string().min(1),
  section: z.enum(['class', 'podcast', 'self-study']),
  type: z.enum(['reading', 'writing', 'listening', 'vocabulary', 'video']),
  date: day,
  files: z.array(download).min(1),
});

export const deckSchema = z.object({
  address: pageAddress.optional(),
  title: z.string().min(1),
  level,
  description: z.string().optional(),
  cards: z.array(word).min(1),
});

export const quizSchema = z.object({
  address: pageAddress.optional(),
  title: z.string().min(1),
  level,
  questions: z.array(question).min(1),
});

export const noticeSchema = z
  .object({
    title: z.string().min(1),
    text: z.string().min(1),
    from: day,
    // No end date: shown until she deletes the notice (e.g. a greeting).
    // Pages CMS may write an emptied date as '' or null: both mean no end date.
    to: z.preprocess((v) => (v === '' || v === null ? undefined : v), day.optional()),
    tone: z.enum(['important', 'news', 'info']),
    pinned: z.boolean().default(false),
    link: z
      .string()
      .regex(/^(https:\/\/|\/)/, 'Use a site path like /classes/ or a full https:// link')
      .optional(),
  })
  .refine((n) => !n.to || n.to >= n.from, {
    message: 'End date is before the start date',
    path: ['to'],
  });

const optionalUrl = z.union([httpsUrl, z.literal('')]).default('');

export const siteSchema = z.object({
  tidycal: optionalUrl,
  // Shown inside the Contact page, so it must be a Tally form.
  contactForm: z
    .union([
      httpsUrl.refine(
        (v) => TALLY_FORM.test(v),
        'Use the Tally form link, like https://tally.so/r/abc123',
      ),
      z.literal(''),
    ])
    .default(''),
  // Holiday decorations: none, automatic by date, or one holiday chosen by hand.
  holiday: z.enum(['none', 'auto', ...HOLIDAY_IDS]).default('none'),
  // Pages CMS drops an object whose fields are all empty, so the key may be missing entirely.
  social: z
    .object({ youtube: optionalUrl, instagram: optionalUrl, kofi: optionalUrl })
    .prefault({}),
});

/** Collection name → schema; used by content.config.ts and the .pages.yml drift test. */
export const SCHEMAS = {
  lessons: lessonSchema,
  materials: materialSchema,
  decks: deckSchema,
  quizzes: quizSchema,
  notices: noticeSchema,
  site: siteSchema,
} as const;
