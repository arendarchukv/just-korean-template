import { describe, expect, it } from 'vitest';
import { pick, sameShape } from './localized';

describe('pick', () => {
  const text = { en: { hi: 'Hi' }, ko: { hi: '안녕' } };
  it('returns the text in the page language', () => {
    expect(pick(text, 'ko').hi).toBe('안녕');
    expect(pick(text, 'en').hi).toBe('Hi');
  });
  it('falls back to English when a language has no text yet', () => {
    expect(pick({ en: { hi: 'Hi' } }, 'ko').hi).toBe('Hi');
  });
});

describe('sameShape', () => {
  it('accepts a translation with the same keys and list lengths', () => {
    expect(
      sameShape(
        { a: 'x', list: [{ t: 'a' }, { t: 'b' }] },
        { a: 'y', list: [{ t: 'c' }, { t: 'd' }] },
      ),
    ).toEqual([]);
  });
  it('names what a translation is missing', () => {
    expect(sameShape({ a: 'x', list: ['1', '2'], o: { b: 'z' } }, { list: ['1'], o: {} })).toEqual([
      'a: missing',
      'list: 1 items, expected 2',
      'o.b: missing',
    ]);
  });
});
