import { describe, expect, it } from 'vitest';
import {
  groupByLevel,
  groupBySeries,
  krdictUrl,
  lessonsForPattern,
  materialSections,
  neighbours,
  sortInSeries,
  youtubeEmbedUrl,
} from './site-logic';

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const lesson = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: id,
  date: d(date),
  grammar: [] as string[],
  downloads: [] as { label: string; kind: string; url: string }[],
  ...extra,
});

describe('sortInSeries', () => {
  it('orders a course by episode, unnumbered last', () => {
    const list = [
      lesson('c', '2022-01-03', { episode: 3 }),
      lesson('x', '2022-01-01'),
      lesson('a', '2022-01-05', { episode: 1 }),
    ];
    expect(sortInSeries(list, 'course').map((l) => l.id)).toEqual(['a', 'c', 'x']);
  });
  it('orders a library newest first', () => {
    const list = [lesson('old', '2021-01-01'), lesson('new', '2026-01-01')];
    expect(sortInSeries(list, 'library').map((l) => l.id)).toEqual(['new', 'old']);
  });
});

describe('groupBySeries', () => {
  const series = [
    { id: 'grammar', title: 'Grammar', kind: 'library' as const, order: 2 },
    { id: 'crash', title: 'Crash', kind: 'course' as const, order: 1 },
    { id: 'empty', title: 'Empty', kind: 'library' as const, order: 3 },
  ];
  it('keeps CMS order, drops empty series, puts loose lessons last', () => {
    const groups = groupBySeries(
      [
        lesson('g1', '2026-01-01', { series: 'grammar' }),
        lesson('c1', '2022-01-01', { series: 'crash', episode: 1 }),
        lesson('loose', '2026-02-01'),
        lesson('orphan', '2026-03-01', { series: 'deleted' }),
      ],
      series,
    );
    expect(groups.map((g) => g.series?.id ?? 'other')).toEqual(['crash', 'grammar', 'other']);
    expect(groups.at(-1)!.lessons.map((l) => l.id)).toEqual(['orphan', 'loose']);
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

describe('lessonsForPattern', () => {
  it('lists lessons that teach a pattern, newest first', () => {
    const list = [
      lesson('old', '2021-01-01', { grammar: ['ge'] }),
      lesson('new', '2026-01-01', { grammar: ['ge', 'dorok'] }),
      lesson('other', '2026-02-01', { grammar: ['dorok'] }),
    ];
    expect(lessonsForPattern(list, 'ge').map((l) => l.id)).toEqual(['new', 'old']);
  });
});

describe('groupByLevel', () => {
  it('groups beginner to advanced and drops empty levels', () => {
    const groups = groupByLevel([
      { level: 'intermediate' as const, pattern: '-게' },
      { level: 'beginner' as const, pattern: '-고' },
      { level: 'intermediate' as const, pattern: '-도록' },
    ]);
    expect(groups.map((g) => g.level)).toEqual(['beginner', 'intermediate']);
    expect(groups[1].items.map((i) => i.pattern)).toEqual(['-게', '-도록']);
  });
});

describe('materialSections', () => {
  const file = { label: 'Worksheet', kind: 'pdf', url: 'https://x.example/a.pdf' };
  it('orders sections, drops empty ones, and adds lesson downloads', () => {
    const sections = materialSections(
      [
        {
          id: 'p1',
          title: 'Podcast 1',
          category: 'podcast',
          tags: [],
          date: d('2026-01-01'),
          files: [file],
        },
        {
          id: 'c1',
          title: 'Family',
          category: 'class-helper',
          tags: ['vocabulary'],
          date: d('2026-06-19'),
          files: [file],
        },
      ],
      [lesson('l1', '2026-03-01', { downloads: [file] }), lesson('l2', '2026-04-01')],
    );
    expect(sections.map((s) => s.id)).toEqual(['class-helper', 'podcast', 'from-lessons']);
    expect(sections.at(-1)!.items).toHaveLength(1);
    expect(sections.at(-1)!.items[0].lesson).toEqual({ id: 'l1', title: 'l1' });
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
