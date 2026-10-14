/** Pure helpers for the content pages: ordering, grouping and links. No Astro imports. */

export type SeriesKind = 'course' | 'library' | 'podcast';
type Dated = { title: string; date: Date; episode?: number };

const newestFirst = (a: Dated, b: Dated) =>
  b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title);

/** Course: by episode (unnumbered last), then date. Library and podcast: newest first. */
export function sortInSeries<L extends Dated>(lessons: L[], kind: SeriesKind): L[] {
  return [...lessons].sort(
    kind === 'course'
      ? (a, b) =>
          (a.episode ?? Infinity) - (b.episode ?? Infinity) || a.date.getTime() - b.date.getTime()
      : newestFirst,
  );
}

/** Series in CMS order with their lessons; lessons without a known series form a last group. */
export function groupBySeries<
  L extends Dated & { id: string; series?: string },
  S extends { id: string; title: string; kind: SeriesKind; order: number },
>(lessons: L[], series: S[]): { series?: S; lessons: L[] }[] {
  const known = new Set(series.map((s) => s.id));
  const groups: { series?: S; lessons: L[] }[] = [...series]
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .map((s) => ({
      series: s,
      lessons: sortInSeries(
        lessons.filter((l) => l.series === s.id),
        s.kind,
      ),
    }))
    .filter((g) => g.lessons.length > 0);
  const loose = lessons.filter((l) => !l.series || !known.has(l.series));
  if (loose.length > 0) groups.push({ lessons: sortInSeries(loose, 'library') });
  return groups;
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

export function lessonsForPattern<L extends Dated & { grammar: string[] }>(
  lessons: L[],
  pattern: string,
): L[] {
  return lessons.filter((l) => l.grammar.includes(pattern)).sort(newestFirst);
}

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export function groupByLevel<G extends { level: (typeof LEVELS)[number]; pattern: string }>(
  items: G[],
): { level: G['level']; items: G[] }[] {
  return LEVELS.map((level) => ({
    level,
    items: items
      .filter((i) => i.level === level)
      .sort((a, b) => a.pattern.localeCompare(b.pattern, 'ko')),
  })).filter((g) => g.items.length > 0);
}

export type MaterialSection = 'class-helper' | 'podcast' | 'extra-notes' | 'from-lessons';
type File = { label: string; kind: string; url: string };
export type MaterialItem = {
  key: string;
  title: string;
  date: Date;
  tags: string[];
  files: File[];
  lesson?: { id: string; title: string };
};

/** Materials page sections in a fixed order; lesson downloads form "from-lessons". */
export function materialSections(
  materials: {
    id: string;
    title: string;
    category: Exclude<MaterialSection, 'from-lessons'> | string;
    tags: string[];
    date: Date;
    files: File[];
    lesson?: { id: string; title: string };
  }[],
  lessons: { id: string; title: string; date: Date; downloads: File[] }[],
): { id: MaterialSection; items: MaterialItem[] }[] {
  const byDate = (a: MaterialItem, b: MaterialItem) => b.date.getTime() - a.date.getTime();
  const own = (id: MaterialSection): MaterialItem[] =>
    materials
      .filter((m) => m.category === id)
      .map((m) => ({
        key: m.id,
        title: m.title,
        date: m.date,
        tags: m.tags,
        files: m.files,
        lesson: m.lesson,
      }))
      .sort(byDate);
  const fromLessons: MaterialItem[] = lessons
    .filter((l) => l.downloads.length > 0)
    .map((l) => ({
      key: `lesson-${l.id}`,
      title: l.title,
      date: l.date,
      tags: [],
      files: l.downloads,
      lesson: { id: l.id, title: l.title },
    }))
    .sort(byDate);
  const sections: { id: MaterialSection; items: MaterialItem[] }[] = [
    { id: 'class-helper', items: own('class-helper') },
    { id: 'podcast', items: own('podcast') },
    { id: 'extra-notes', items: own('extra-notes') },
    { id: 'from-lessons', items: fromLessons },
  ];
  return sections.filter((s) => s.items.length > 0);
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
