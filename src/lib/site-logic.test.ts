import { describe, expect, it } from 'vitest';
import {
  grammarTags,
  krdictUrl,
  materialTabs,
  neighbours,
  practiceUnits,
  sortInPlaylist,
  tagSlug,
  youtubeEmbedUrl,
} from './site-logic';

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const lesson = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: id,
  date: d(date),
  level: 'beginner' as const,
  grammar: [] as string[],
  files: [] as { label: string; kind: string; url: string }[],
  ...extra,
});
/** Words of a test lesson (the helper's extra fields are untyped). */
const wordsOf = (l: object) => (l as { words: { front: string; back: string }[] }).words;
const file = (label: string) => ({ label, kind: 'pdf', url: `https://f.example/${label}.pdf` });

describe('sortInPlaylist', () => {
  it('orders a course oldest first (watch in order)', () => {
    const list = [lesson('c', '2022-01-03'), lesson('a', '2022-01-01'), lesson('b', '2022-01-02')];
    expect(sortInPlaylist(list, 'course').map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });
  it('orders a library newest first', () => {
    const list = [lesson('old', '2021-01-01'), lesson('new', '2026-01-01')];
    expect(sortInPlaylist(list, 'library').map((l) => l.id)).toEqual(['new', 'old']);
  });
});

describe('neighbours', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  it('finds previous and next', () => {
    expect(neighbours(list, 'b')).toEqual({ prev: { id: 'a' }, next: { id: 'c' } });
  });
  it('has nothing at the ends or for a lone lesson', () => {
    expect(neighbours(list, 'a').prev).toBeUndefined();
    expect(neighbours(list, 'c').next).toBeUndefined();
    expect(neighbours([{ id: 'x' }], 'x')).toEqual({ prev: undefined, next: undefined });
  });
});

describe('practiceUnits', () => {
  const words = [{ front: '안 가요', back: "I don't go" }];
  it('adds the words of each lesson as a unit named after the lesson, separate ones first', () => {
    const units = practiceUnits(
      [{ id: 'food', title: 'Food', level: 'beginner' as const, cards: words }],
      [
        lesson('neg', '2022-01-01', { title: 'Negative form', words }),
        lesson('none', '2022-01-02', { words: [] }),
      ],
      (l) => ({ cards: wordsOf(l) }),
      (l) => wordsOf(l).length > 0,
    );
    expect(units.map((u) => [u.id, u.title, u.lessonEntry?.id])).toEqual([
      ['food', 'Food', undefined],
      ['neg', 'Negative form', 'neg'],
    ]);
    expect(units[1]).toMatchObject({ level: 'beginner', cards: words });
  });
  it('refuses a separate entry with the same id as a lesson that has its own', () => {
    expect(() =>
      practiceUnits(
        [{ id: 'neg', title: 'Neg', level: 'beginner' as const, cards: words }],
        [lesson('neg', '2022-01-01', { words })],
        (l) => ({ cards: wordsOf(l) }),
        () => true,
      ),
    ).toThrow(/"neg"/);
  });
});

describe('grammarTags', () => {
  it('lists each tag once, in Korean order, with its lessons newest first', () => {
    const tags = grammarTags([
      lesson('old', '2021-01-01', { grammar: ['-게'] }),
      lesson('new', '2026-01-01', { grammar: ['-게', '-도록'] }),
      lesson('plain', '2026-02-01'),
    ]);
    expect(tags.map((t) => t.tag)).toEqual(['-게', '-도록']);
    expect(tags[0]!.lessons.map((l) => l.id)).toEqual(['new', 'old']);
  });
  it('merges tags that differ only in spaces', () => {
    const tags = grammarTags([
      lesson('a', '2021-01-01', { grammar: ['-아/어 봤자'] }),
      lesson('b', '2022-01-01', { grammar: [' -아/어  봤자 '] }),
    ]);
    expect(tags).toHaveLength(1);
    expect(tags[0]!.lessons).toHaveLength(2);
  });
  it('gives every tag a stable anchor', () => {
    expect(tagSlug('-아/어 봤자')).toBe(tagSlug(' -아/어  봤자'));
    expect(tagSlug('-게')).not.toBe(tagSlug('-도록'));
    expect(tagSlug('-게')).toMatch(/^g-/);
  });
});

describe('materialTabs', () => {
  it('orders tabs, drops empty ones, newest first, and adds lesson files last', () => {
    const tabs = materialTabs(
      [
        {
          id: 'old',
          title: 'Old',
          section: 'class',
          type: 'vocabulary',
          date: d('2026-01-01'),
          files: [file('o')],
        },
        {
          id: 'new',
          title: 'New',
          section: 'class',
          type: 'reading',
          date: d('2026-06-01'),
          files: [file('n')],
        },
        {
          id: 'pod',
          title: 'Pod',
          section: 'podcast',
          type: 'listening',
          date: d('2026-02-01'),
          files: [file('p')],
        },
      ],
      [
        lesson('l1', '2026-03-01', { title: 'Numbers', files: [file('w')] }),
        lesson('l2', '2026-04-01'),
      ],
    );
    expect(tabs.map((t) => t.id)).toEqual(['class', 'podcast', 'from-lessons']);
    expect(tabs[0]!.items.map((i) => i.key)).toEqual(['new', 'old']);
    expect(tabs[2]!.items).toEqual([
      expect.objectContaining({
        key: 'lesson-l1',
        title: 'Numbers',
        lesson: { id: 'l1', title: 'Numbers' },
      }),
    ]);
    expect(tabs[2]!.items[0]!.type).toBeUndefined();
  });
});

describe('urls', () => {
  it('builds a krdict search link', () => {
    expect(krdictUrl('사랑')).toBe(
      'https://krdict.korean.go.kr/eng/dicMarinerSearch/search?nation=eng&nationCode=6&mainSearchWord=%EC%82%AC%EB%9E%91',
    );
  });
  it('builds a privacy-friendly embed link', () => {
    expect(youtubeEmbedUrl('R3Ny_hDzKpc')).toBe(
      'https://www.youtube-nocookie.com/embed/R3Ny_hDzKpc?autoplay=1&rel=0',
    );
  });
});
