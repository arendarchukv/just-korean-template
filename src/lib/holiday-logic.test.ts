import { describe, expect, it } from 'vitest';
import { LUNAR_DAYS } from '../data/holidays';
import { holidayOn, holidayRender } from './holiday-logic';

describe('holidayOn', () => {
  it('shows Chuseok from 3 days before to the day after', () => {
    expect(holidayOn('2026-09-21')).toBeUndefined();
    expect(holidayOn('2026-09-22')).toBe('chuseok');
    expect(holidayOn('2026-09-26')).toBe('chuseok');
    expect(holidayOn('2026-09-27')).toBeUndefined();
  });

  it('shows Seollal on its Korean date, across a month end', () => {
    expect(holidayOn('2027-02-03')).toBeUndefined();
    expect(holidayOn('2027-02-04')).toBe('seollal');
    expect(holidayOn('2027-02-08')).toBe('seollal');
    expect(holidayOn('2027-02-09')).toBeUndefined();
    expect(holidayOn('2028-01-24')).toBe('seollal');
  });

  it('shows Christmas from 20 to 26 December', () => {
    expect(holidayOn('2026-12-19')).toBeUndefined();
    expect(holidayOn('2026-12-20')).toBe('christmas');
    expect(holidayOn('2026-12-26')).toBe('christmas');
    expect(holidayOn('2026-12-27')).toBeUndefined();
  });

  it('shows Hangul Day and Liberation Day on the eve and the day', () => {
    expect(holidayOn('2026-10-07')).toBeUndefined();
    expect(holidayOn('2026-10-08')).toBe('hangeulnal');
    expect(holidayOn('2026-10-09')).toBe('hangeulnal');
    expect(holidayOn('2026-08-14')).toBe('gwangbokjeol');
    expect(holidayOn('2026-08-16')).toBeUndefined();
  });

  it('shows nothing past the lunar table', () => {
    expect(holidayOn('2036-12-25')).toBeUndefined();
    expect(holidayOn('2025-12-25')).toBeUndefined();
  });
});

describe('lunar table', () => {
  const years = Array.from({ length: 10 }, (_, i) => 2026 + i);

  it('has Seollal and Chuseok for every year 2026–2035', () => {
    for (const y of years) {
      expect(LUNAR_DAYS.seollal[y], `seollal ${y}`).toMatch(new RegExp(`^${y}-0[12]-\\d\\d$`));
      expect(LUNAR_DAYS.chuseok[y], `chuseok ${y}`).toMatch(new RegExp(`^${y}-(09|10)-\\d\\d$`));
    }
  });

  it('runs at least two years ahead (extend it from the official Korean calendar)', () => {
    const last = Math.max(...Object.keys(LUNAR_DAYS.seollal).map(Number));
    expect(last).toBeGreaterThanOrEqual(new Date().getFullYear() + 2);
  });
});

describe('holidayRender', () => {
  it('renders nothing for none', () => {
    expect(holidayRender('none')).toEqual({ pieces: false, script: false });
  });
  it('leaves the choice to the script for auto', () => {
    expect(holidayRender('auto')).toEqual({ pieces: true, script: true });
  });
  it('writes a chosen holiday into the page, with no script', () => {
    expect(holidayRender('chuseok')).toEqual({ pieces: true, script: false, fixed: 'chuseok' });
  });
});
