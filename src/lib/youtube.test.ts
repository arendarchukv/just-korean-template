import { describe, expect, it } from 'vitest';
import { parseYouTubeId, youtubeThumbnail, youtubeThumbnailLarge } from './youtube';

describe('parseYouTubeId', () => {
  it.each([
    ['_lgDjyWiheU', '_lgDjyWiheU'],
    ['  R3Ny_hDzKpc  ', 'R3Ny_hDzKpc'],
    ['https://www.youtube.com/watch?v=_lgDjyWiheU', '_lgDjyWiheU'],
    ['https://www.youtube.com/watch?v=_lgDjyWiheU&t=42s&si=abc', '_lgDjyWiheU'],
    ['https://m.youtube.com/watch?v=_lgDjyWiheU', '_lgDjyWiheU'],
    ['https://youtu.be/_lgDjyWiheU?si=xyz', '_lgDjyWiheU'],
    ['https://www.youtube.com/shorts/_lgDjyWiheU', '_lgDjyWiheU'],
    ['https://www.youtube.com/embed/_lgDjyWiheU', '_lgDjyWiheU'],
  ])('reads %s', (input, id) => {
    expect(parseYouTubeId(input)).toBe(id);
  });

  it.each([
    '',
    'hello',
    'https://vimeo.com/12345678901',
    'https://www.youtube.com/@JustKorean',
    'https://www.youtube.com/playlist?list=PLciVMc5G4V70rHatPHL57LXh5GAcIdqL_',
  ])('rejects %s', (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });
});

describe('youtubeThumbnail', () => {
  it('builds the hqdefault URL', () => {
    expect(youtubeThumbnail('_lgDjyWiheU')).toBe(
      'https://i.ytimg.com/vi/_lgDjyWiheU/hqdefault.jpg',
    );
  });
});

describe('youtubeThumbnailLarge', () => {
  it('builds the 640px sddefault URL for the lesson player', () => {
    expect(youtubeThumbnailLarge('_lgDjyWiheU')).toBe(
      'https://i.ytimg.com/vi/_lgDjyWiheU/sddefault.jpg',
    );
  });
});
