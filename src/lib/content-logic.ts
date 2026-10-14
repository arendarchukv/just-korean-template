import { slug } from 'github-slugger';

/**
 * Entry id from a reference value, slugged the way Astro's glob loader slugs file paths.
 * Pages CMS may store a bare name, a filename with extension, or a path under src/content.
 */
export function toEntryId(value: string): string {
  const parts = value.replaceAll('\\', '/').split('/');
  const content = parts.lastIndexOf('content');
  // Keep only the path inside the collection folder (src/content/<collection>/...).
  const inside = content >= 0 ? parts.slice(content + 2) : parts.slice(-1);
  return inside
    .map((part, i) => (i === inside.length - 1 ? part.replace(/\.(md|ya?ml)$/i, '') : part))
    .map((part) => slug(part))
    .join('/');
}

/** Local calendar day as YYYY-MM-DD. */
export function toDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isNoticeActive(n: { from: Date; to: Date }, today: string): boolean {
  return toDay(n.from) <= today && today <= toDay(n.to);
}

export type NoticeTone = 'important' | 'news' | 'info';
export type NoticeLike = { id: string; from: Date; to: Date; tone: NoticeTone };

const TONE_ORDER: Record<NoticeTone, number> = { important: 0, news: 1, info: 2 };

/**
 * Every notice: important, then news, then info; within a tone, the earliest start. Expired ones are rendered too (hidden):
 * the browser decides by its own date, so the built page does not depend on the build date.
 */
export function sortNotices<T extends NoticeLike>(notices: T[]): T[] {
  return [...notices].sort(
    (a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone] || a.from.getTime() - b.from.getTime(),
  );
}

/** Latest lessons that have a YouTube video, newest first. */
export function selectNewLessons<T extends { youtube?: string; date: Date; title: string }>(
  lessons: T[],
  count: number,
): T[] {
  return lessons
    .filter((l) => l.youtube)
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title))
    .slice(0, count);
}
