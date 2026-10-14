import { z } from 'astro/zod';
import { toEntryId } from '../lib/content-logic';
import { parseYouTubeId } from '../lib/youtube';

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
    .array(
      z.object({ name: z.string().min(1), forWhom: z.string().min(1), how: z.string().min(1) }),
    )
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
