/** Pure helpers for the content pages: ordering, grouping and links. No Astro imports. */
import { slug } from 'github-slugger';

export type PlaylistKind = 'course' | 'library' | 'podcast';
type Dated = { title: string; date: Date };

const newestFirst = (a: Dated, b: Dated) =>
  b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title);

/** Course: oldest first, so it is watched in order. Library and podcast: newest first. */
export function sortInPlaylist<L extends Dated>(lessons: L[], kind: PlaylistKind): L[] {
  return [...lessons].sort(
    kind === 'course'
      ? (a, b) => a.date.getTime() - b.date.getTime() || a.title.localeCompare(b.title)
      : newestFirst,
  );
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

type Level = 'beginner' | 'intermediate' | 'advanced';
type LessonLike = Dated & { id: string; level: Level };

/**
 * Decks or quizzes for the Practice page: the separate entries, then one per lesson that has its
 * own (named after the lesson, same id, linked back). An id used twice would make two pages
 * collide, so it stops the build.
 */
export function practiceUnits<
  U extends { id: string; title: string; level: Level },
  L extends LessonLike,
  Part extends object,
>(
  separate: U[],
  lessons: L[],
  part: (lesson: L) => Part,
  has: (lesson: L) => boolean,
): (Omit<U, keyof Part> & Part & { lessonEntry?: { id: string; title: string } })[] {
  type Unit = Omit<U, keyof Part> & Part & { lessonEntry?: { id: string; title: string } };
  const own = lessons.filter(has);
  for (const l of own) {
    if (separate.some((s) => s.id === l.id)) {
      throw new Error(`"${l.id}" is both a separate entry and a lesson with its own; rename one`);
    }
  }
  const fromLessons = own.map(
    (l) =>
      ({
        id: l.id,
        title: l.title,
        level: l.level,
        ...part(l),
        lessonEntry: { id: l.id, title: l.title },
      }) as unknown as Unit,
  );
  return [...(separate as unknown as Unit[]), ...fromLessons];
}

/** Tags are typed by hand: spaces are trimmed and collapsed so "-게 " and "-게" are one tag. */
const normalTag = (tag: string) => tag.trim().replace(/\s+/g, ' ');

/** Anchor id for a grammar tag on the grammar page (Korean letters kept). */
export function tagSlug(tag: string): string {
  return `g-${slug(normalTag(tag)).replace(/^-+/, '')}`;
}

/** Every grammar tag once, in Korean order, with the lessons that explain it (newest first). */
export function grammarTags<L extends Dated & { id: string; grammar: string[] }>(
  lessons: L[],
): { tag: string; slug: string; lessons: L[] }[] {
  const byTag = new Map<string, L[]>();
  for (const l of lessons) {
    for (const tag of new Set(l.grammar.map(normalTag).filter(Boolean))) {
      byTag.set(tag, [...(byTag.get(tag) ?? []), l]);
    }
  }
  return [...byTag]
    .sort(([a], [b]) => a.localeCompare(b, 'ko'))
    .map(([tag, list]) => ({ tag, slug: tagSlug(tag), lessons: list.sort(newestFirst) }));
}

export type MaterialTab = 'class' | 'podcast' | 'self-study' | 'from-lessons';
export type MaterialType = 'reading' | 'writing' | 'listening' | 'vocabulary' | 'video';
type File = { label: string; kind: string; url: string };
export type MaterialItem = {
  key: string;
  title: string;
  /** Separate materials have a type; files from a lesson do not. */
  type?: MaterialType;
  date: Date;
  files: File[];
  lesson?: { id: string; title: string };
};

/** Materials page tabs in a fixed order, newest first; files added to lessons form the last tab. */
export function materialTabs(
  materials: {
    id: string;
    title: string;
    section: Exclude<MaterialTab, 'from-lessons'>;
    type: MaterialType;
    date: Date;
    files: File[];
  }[],
  lessons: { id: string; title: string; date: Date; files: File[] }[],
): { id: MaterialTab; items: MaterialItem[] }[] {
  const byDate = (a: MaterialItem, b: MaterialItem) => b.date.getTime() - a.date.getTime();
  const own = (id: MaterialTab): MaterialItem[] =>
    materials
      .filter((m) => m.section === id)
      .map((m) => ({ key: m.id, title: m.title, type: m.type, date: m.date, files: m.files }))
      .sort(byDate);
  const fromLessons: MaterialItem[] = lessons
    .filter((l) => l.files.length > 0)
    .map((l) => ({
      key: `lesson-${l.id}`,
      title: l.title,
      date: l.date,
      files: l.files,
      lesson: { id: l.id, title: l.title },
    }))
    .sort(byDate);
  const tabs: { id: MaterialTab; items: MaterialItem[] }[] = [
    { id: 'class', items: own('class') },
    { id: 'podcast', items: own('podcast') },
    { id: 'self-study', items: own('self-study') },
    { id: 'from-lessons', items: fromLessons },
  ];
  return tabs.filter((t) => t.items.length > 0);
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

/** A Tally form link (tally.so/r/<id>, or an embed link) and its form id. */
export const TALLY_FORM = /^https:\/\/tally\.so\/(?:r|embed)\/([A-Za-z0-9]+)/;

/** The embed address of a Tally form link: no title (the page has one), transparent, left-aligned. */
export function tallyEmbedUrl(link: string): string {
  const id = TALLY_FORM.exec(link)?.[1];
  if (!id) throw new Error(`Not a Tally form link: ${link}`);
  return `https://tally.so/embed/${id}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`;
}
