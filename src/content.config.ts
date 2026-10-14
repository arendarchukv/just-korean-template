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
  site: defineCollection({ loader: one('site'), schema: SCHEMAS.site }),
};
