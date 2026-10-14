import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/**
 * The only module that reads content. Pages never call getCollection directly, so content
 * translations (or any other change in where content comes from) can be added here later.
 */

type Referable = 'series' | 'grammar' | 'lessons';

async function resolve<C extends Referable>(
  collection: C,
  id: string,
  from: string,
): Promise<CollectionEntry<C>> {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`${from} "${id}" not found`);
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
        seriesEntry: l.data.series
          ? await resolve('series', l.data.series, `${from}: series`)
          : undefined,
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
  for (const name of ['materials', 'decks', 'quizzes'] as const) {
    for (const e of await getCollection(name)) {
      if (e.data.lesson) await resolve('lessons', e.data.lesson, `${name}/${e.id}: lesson`);
    }
  }
}
