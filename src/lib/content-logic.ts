/** Entry id from a reference value; Pages CMS may store a path or a filename with extension. */
export function toEntryId(value: string): string {
  const last = value.replaceAll('\\', '/').split('/').pop() ?? value;
  return last.replace(/\.(md|ya?ml)$/i, '');
}

/** Local calendar day as YYYY-MM-DD. */
export function toDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isNoticeActive(n: { from: Date; to: Date }, today: string): boolean {
  return toDay(n.from) <= today && today <= toDay(n.to);
}

export type NoticeLike = { id: string; from: Date; to: Date; tone: 'important' | 'info' };

/** Notices not yet expired: important first, then the earliest start. */
export function selectNotices<T extends NoticeLike>(notices: T[], today: string): T[] {
  return notices
    .filter((n) => toDay(n.to) >= today)
    .sort(
      (a, b) =>
        Number(b.tone === 'important') - Number(a.tone === 'important') ||
        a.from.getTime() - b.from.getTime(),
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
