import { z } from 'astro/zod';
import { PLAYLIST_IDS } from '../data/playlists';
import { parseYouTubeId } from '../lib/youtube';

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

/**
 * A lesson is a container: besides the video and text it may carry its own words, quiz and files.
 * Nothing points to another form; the playlist comes from a fixed list in code.
 */
export const lessonSchema = z.object({
  title: z.string().min(1),
  youtube: youtube.optional(),
  playlist: z.enum(PLAYLIST_IDS).optional(),
  date: day,
  level,
  summary: z.string().optional(),
  /** Grammar patterns as typed, e.g. "-게"; the grammar page is built from them. */
  grammar: z.array(z.string().trim().min(1)).default([]),
  words: z.array(word).default([]),
  quiz: z.array(question).default([]),
  files: z.array(download).default([]),
});

export const materialSchema = z.object({
  title: z.string().min(1),
  section: z.enum(['class', 'podcast', 'self-study']),
  type: z.enum(['reading', 'writing', 'listening', 'vocabulary', 'video']),
  date: day,
  files: z.array(download).min(1),
});

export const deckSchema = z.object({
  title: z.string().min(1),
  level,
  description: z.string().optional(),
  cards: z.array(word).min(1),
});

export const quizSchema = z.object({
  title: z.string().min(1),
  level,
  questions: z.array(question).min(1),
});

export const noticeSchema = z
  .object({
    title: z.string().min(1),
    text: z.string().min(1),
    from: day,
    to: day,
    tone: z.enum(['important', 'news', 'info']),
    pinned: z.boolean().default(false),
    link: z
      .string()
      .regex(/^(https:\/\/|\/)/, 'Use a site path like /classes/ or a full https:// link')
      .optional(),
  })
  .refine((n) => n.to >= n.from, { message: 'End date is before the start date', path: ['to'] });

const optionalUrl = z.union([httpsUrl, z.literal('')]).default('');

export const siteSchema = z.object({
  tidycal: optionalUrl,
  contactForm: optionalUrl,
  quizResultsForm: optionalUrl,
  filesBaseUrl: optionalUrl,
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
