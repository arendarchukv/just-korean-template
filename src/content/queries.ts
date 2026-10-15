import { getCollection, getEntry, render, type CollectionEntry } from 'astro:content';
import { PLAYLISTS } from '@/data/playlists';
import { grammarTags, materialTabs, practiceUnits } from '@/lib/site-logic';

/**
 * The only module that reads content. Pages never call getCollection directly, so content
 * translations (or any other change in where content comes from) can be added here later.
 * Forms do not point at each other: a lesson carries its own words, quiz and files, and the
 * Practice and Materials pages gather them together with the separate entries.
 */

export type Playlist = (typeof PLAYLISTS)[number];

export type Lesson = CollectionEntry<'lessons'>['data'] & {
  id: string;
  playlistEntry?: Playlist;
};

export async function getLessons(): Promise<Lesson[]> {
  return (await getCollection('lessons')).map((l) => ({
    ...l.data,
    id: l.id,
    playlistEntry: PLAYLISTS.find((p) => p.id === l.data.playlist),
  }));
}

export function getPlaylists(): readonly Playlist[] {
  return PLAYLISTS;
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

/** Every flashcard deck: the separate ones, then one per lesson with its own words. */
export async function getDecks() {
  const separate = (await getCollection('decks')).map((d) => ({ ...d.data, id: d.id }));
  return practiceUnits(
    separate,
    await getLessons(),
    (l) => ({ cards: l.words }),
    (l) => l.words.length > 0,
  );
}

/** Every quiz: the separate ones, then one per lesson with its own questions. */
export async function getQuizzes() {
  const separate = (await getCollection('quizzes')).map((q) => ({ ...q.data, id: q.id }));
  return practiceUnits(
    separate,
    await getLessons(),
    (l) => ({ questions: l.quiz }),
    (l) => l.quiz.length > 0,
  );
}

/** Materials page tabs: separate materials by section, then the files added to lessons. */
export async function getMaterialTabs() {
  const materials = (await getCollection('materials')).map((m) => ({ ...m.data, id: m.id }));
  return materialTabs(materials, await getLessons());
}

/** Grammar tags typed on lessons, each with the lessons that explain it. */
export async function getGrammarTags() {
  return grammarTags(await getLessons());
}

/** Fails the build on content that would make two pages collide (see practiceUnits). */
export async function validateContent(): Promise<void> {
  await getDecks();
  await getQuizzes();
}

/** Rendered Markdown body of a lesson. */
export async function renderBody(id: string) {
  const entry = await getEntry('lessons', id);
  if (!entry) throw new Error(`lessons/${id} not found`);
  return (await render(entry)).Content;
}
