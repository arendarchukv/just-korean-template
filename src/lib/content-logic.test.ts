import { describe, expect, it } from 'vitest';
import { isNoticeActive, selectNewLessons, selectNotices, toDay, toEntryId } from './content-logic';

const d = (s: string) => new Date(`${s}T00:00:00`);

describe('toEntryId', () => {
  it.each([
    ['ge', 'ge'],
    ['ge.md', 'ge'],
    ['src/content/grammar/ge.md', 'ge'],
    ['src\\content\\series\\crash-course.yml', 'crash-course'],
    ['content/decks/food.yaml', 'food'],
  ])('%s -> %s', (input, id) => {
    expect(toEntryId(input)).toBe(id);
  });
});

describe('notices', () => {
  const n = (id: string, from: string, to: string, tone: 'important' | 'info' = 'info') => ({
    id,
    from: d(from),
    to: d(to),
    tone,
  });

  it('formats a local day', () => {
    expect(toDay(d('2026-10-14'))).toBe('2026-10-14');
  });

  it('is active on both boundary days', () => {
    expect(isNoticeActive(n('a', '2026-10-12', '2026-12-18'), '2026-10-12')).toBe(true);
    expect(isNoticeActive(n('a', '2026-10-12', '2026-12-18'), '2026-12-18')).toBe(true);
    expect(isNoticeActive(n('a', '2026-10-12', '2026-12-18'), '2026-12-19')).toBe(false);
    expect(isNoticeActive(n('a', '2026-10-12', '2026-12-18'), '2026-10-11')).toBe(false);
  });

  it('keeps current and upcoming notices, important first', () => {
    const list = [
      n('old', '2026-01-01', '2026-10-13'),
      n('info', '2026-10-01', '2026-12-18'),
      n('soon', '2026-12-19', '2027-01-01', 'important'),
      n('now', '2026-10-10', '2026-10-20', 'important'),
    ];
    expect(selectNotices(list, '2026-10-14').map((x) => x.id)).toEqual(['now', 'soon', 'info']);
  });
});

describe('selectNewLessons', () => {
  const l = (title: string, date: string, youtube?: string) => ({ title, date: d(date), youtube });

  it('takes only video lessons, newest first, limited', () => {
    const list = [
      l('A', '2026-09-01', 'aaaaaaaaaaa'),
      l('No video', '2026-10-10'),
      l('C', '2026-10-01', 'ccccccccccc'),
      l('B', '2026-10-01', 'bbbbbbbbbbb'),
    ];
    expect(selectNewLessons(list, 2).map((x) => x.title)).toEqual(['B', 'C']);
  });

  it('returns fewer when there are not enough', () => {
    expect(selectNewLessons([l('No video', '2026-10-10')], 3)).toEqual([]);
  });
});
