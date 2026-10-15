/**
 * The channel's playlists. Hardcoded on purpose: they change rarely, so they are not a Pages CMS
 * form; a lesson picks one by id from a fixed list (`.pages.yml` options must match, tested).
 * Order here is the order on the Lessons page. A course is watched in order (oldest first).
 */
export const PLAYLISTS = [
  {
    id: 'crash-course',
    title: 'Beginner Korean Crash Course',
    kind: 'course',
    description:
      'Ten short lessons that take you from the alphabet to your first conversations. Watch them in order.',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V73s1mfuvXEIoK2J5JKHTEkL',
  },
  {
    id: 'grammar',
    title: 'Grammar',
    kind: 'library',
    description: 'Patterns explained side by side, so you know which one to use and when.',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V70rHatPHL57LXh5GAcIdqL_',
  },
] as const satisfies readonly {
  id: string;
  title: string;
  kind: 'course' | 'library' | 'podcast';
  description?: string;
  youtube?: string;
}[];

export type PlaylistId = (typeof PLAYLISTS)[number]['id'];
export const PLAYLIST_IDS = PLAYLISTS.map((p) => p.id) as [PlaylistId, ...PlaylistId[]];
