import { getCollection, getEntry, render, type CollectionEntry } from 'astro:content';

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

/** Site settings (links she sets in Pages CMS). */
export async function getSite() {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('settings/site.yml is missing');
  return entry.data;
}

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

/** Adds the linked lesson's id and title to a material, deck or quiz (checked: it must exist). */
async function withLesson<T extends { lesson?: string }>(data: T, from: string) {
  if (!data.lesson) return { ...data, lessonEntry: undefined };
  const entry = await resolve('lessons', data.lesson, `${from}: lesson`);
  return { ...data, lessonEntry: { id: entry.id, title: entry.data.title } };
}

export async function getSeries() {
  return (await getCollection('series')).map((s) => ({ ...s.data, id: s.id }));
}

export async function getGrammar() {
  return (await getCollection('grammar')).map((g) => ({ ...g.data, id: g.id }));
}

export async function getMaterials() {
  const entries = await getCollection('materials');
  return Promise.all(
    entries.map(async (m) => ({ ...(await withLesson(m.data, `materials/${m.id}`)), id: m.id })),
  );
}

export async function getDecks() {
  const entries = await getCollection('decks');
  return Promise.all(
    entries.map(async (d) => ({ ...(await withLesson(d.data, `decks/${d.id}`)), id: d.id })),
  );
}

export async function getQuizzes() {
  const entries = await getCollection('quizzes');
  return Promise.all(
    entries.map(async (q) => ({ ...(await withLesson(q.data, `quizzes/${q.id}`)), id: q.id })),
  );
}

/** Rendered Markdown body of a lesson or grammar entry. */
export async function renderBody(collection: 'lessons' | 'grammar', id: string) {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`${collection}/${id} not found`);
  return (await render(entry)).Content;
}
