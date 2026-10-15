/**
 * The channel's playlists. Hardcoded on purpose: they change rarely, so they are not a Pages CMS
 * form; a lesson picks one by id from a fixed list (`.pages.yml` options must match, tested).
 * Order here is the order on the Lessons page. A course is watched in order (oldest first).
 * Title and description in every interface language (`playlistText(p, lang)`). Korean: TODO(ko-review).
 */
import { pick, type Localized } from '../i18n/localized';
import type { Lang } from '../i18n/ui';

type PlaylistText = { title: string; description: string };

export const PLAYLISTS = [
  {
    id: 'crash-course',
    kind: 'course',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V73s1mfuvXEIoK2J5JKHTEkL',
    text: {
      en: {
        title: 'Beginner Korean Crash Course',
        description:
          'Ten short lessons that take you from the alphabet to your first conversations. Watch them in order.',
      },
      ko: {
        title: '초급 한국어 집중 코스',
        description: '한글부터 첫 대화까지 이어지는 짧은 강의 10개예요. 순서대로 보세요.',
      },
    },
  },
  {
    id: 'grammar',
    kind: 'library',
    youtube: 'https://www.youtube.com/playlist?list=PLciVMc5G4V70rHatPHL57LXh5GAcIdqL_',
    text: {
      en: {
        title: 'Grammar',
        description: 'Patterns explained side by side, so you know which one to use and when.',
      },
      ko: {
        title: '문법',
        description: '비슷한 문법을 나란히 설명해서 언제 무엇을 써야 하는지 알 수 있어요.',
      },
    },
  },
] as const satisfies readonly {
  id: string;
  kind: 'course' | 'library' | 'podcast';
  youtube?: string;
  text: Localized<PlaylistText>;
}[];

export type PlaylistId = (typeof PLAYLISTS)[number]['id'];
export const PLAYLIST_IDS = PLAYLISTS.map((p) => p.id) as [PlaylistId, ...PlaylistId[]];

/** A playlist's title and description in the page language (English when missing). */
export function playlistText(playlist: { text: unknown }, lang: Lang): PlaylistText {
  return pick(playlist.text as Localized<PlaylistText>, lang);
}
