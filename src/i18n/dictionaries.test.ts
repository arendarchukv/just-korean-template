import { describe, expect, it } from 'vitest';
import { LANGS, LOCALES } from './locales';
import { ui } from './ui';

const english = Object.keys(ui.en);

describe('interface dictionaries', () => {
  it('exist for every language in locales.ts', () => {
    expect(Object.keys(ui).sort()).toEqual([...LANGS].sort());
  });

  for (const lang of LANGS.filter((l) => l !== 'en')) {
    const dict = ui[lang] as Record<string, string>;
    it(`${lang} (${LOCALES[lang].name}) has no keys English lacks (typos)`, () => {
      expect(Object.keys(dict).filter((k) => !english.includes(k))).toEqual([]);
    });
    it(`${lang} translates every interface string`, () => {
      expect(english.filter((k) => !dict[k]?.trim())).toEqual([]);
    });
  }
});
