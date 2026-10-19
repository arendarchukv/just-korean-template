/** Local calendar day as YYYY-MM-DD. */
export function toDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Calendar day of a date written in content (YAML `2026-12-18` = UTC midnight), the same in any
 * time zone of the build machine. `toDay` is for "today" on the visitor's or builder's clock.
 */
export function contentDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isNoticeActive(n: { from: Date; to: Date }, today: string): boolean {
  return contentDay(n.from) <= today && today <= contentDay(n.to);
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

/**
 * Latest lessons that have a picture for their card (a YouTube video or a cover), newest first.
 * A lesson with neither would show only the paper placeholder on the home page.
 */
export function selectNewLessons<
  T extends { youtube?: string; cover?: unknown; date: Date; title: string },
>(lessons: T[], count: number): T[] {
  return lessons
    .filter((l) => l.youtube || l.cover)
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title))
    .slice(0, count);
}
