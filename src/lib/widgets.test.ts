import { afterEach, describe, expect, it, vi } from 'vitest';
import { deckKey, isFillCorrect, quizKey, readStore, remainingCards, writeStore } from './widgets';

describe('isFillCorrect', () => {
  it('ignores surrounding spaces and case', () => {
    expect(isFillCorrect('  게 ', '게')).toBe(true);
    expect(isFillCorrect('So That', 'so that')).toBe(true);
  });
  it('accepts an alternative answer', () => {
    expect(isFillCorrect('도록', '게', ['도록'])).toBe(true);
  });
  it('rejects a wrong or empty answer', () => {
    expect(isFillCorrect('려고', '게', ['도록'])).toBe(false);
    expect(isFillCorrect('   ', '게')).toBe(false);
  });
});

describe('remainingCards', () => {
  const cards = [{ front: '안 가요' }, { front: '가지 않아요' }, { front: '못 가요' }];
  it('keeps order and skips known cards', () => {
    expect(remainingCards(cards, new Set(['가지 않아요'])).map((c) => c.front)).toEqual([
      '안 가요',
      '못 가요',
    ]);
  });
  it('is empty when every card is known', () => {
    expect(remainingCards(cards, new Set(cards.map((c) => c.front)))).toEqual([]);
  });
});

describe('storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  const memory = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
  };

  it('round-trips JSON', () => {
    vi.stubGlobal('localStorage', memory());
    writeStore('jk:test', { best: 2 });
    expect(readStore('jk:test', { best: 0 })).toEqual({ best: 2 });
  });

  it('falls back when the stored value is broken', () => {
    const store = memory();
    store.setItem('jk:test', '{not json');
    vi.stubGlobal('localStorage', store);
    expect(readStore('jk:test', [])).toEqual([]);
  });

  it('never throws when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readStore('jk:test', 7)).toBe(7);
    expect(() => writeStore('jk:test', 1)).not.toThrow();
  });

  it('names keys per widget', () => {
    expect(deckKey('food')).toBe('jk:deck:food');
    expect(quizKey('ge-vs-dorok')).toBe('jk:quiz:ge-vs-dorok');
  });
});
