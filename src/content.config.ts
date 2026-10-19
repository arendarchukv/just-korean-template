import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { makeLessonSchema, SCHEMAS } from '@/content/schemas';

const base = './src/content';
const many = (dir: string, ext: string) => glob({ pattern: `**/*.${ext}`, base: `${base}/${dir}` });
const one = (name: string) => glob({ pattern: `${name}.yml`, base: `${base}/settings` });

export const collections = {
  lessons: defineCollection({
    loader: many('lessons', 'md'),
    // The cover is an image in the repository: Astro checks the file exists and optimises it.
    schema: ({ image }) => makeLessonSchema(image()),
  }),
  materials: defineCollection({ loader: many('materials', 'yml'), schema: SCHEMAS.materials }),
  decks: defineCollection({ loader: many('decks', 'yml'), schema: SCHEMAS.decks }),
  quizzes: defineCollection({ loader: many('quizzes', 'yml'), schema: SCHEMAS.quizzes }),
  notices: defineCollection({ loader: many('notices', 'yml'), schema: SCHEMAS.notices }),
  site: defineCollection({ loader: one('site'), schema: SCHEMAS.site }),
};
