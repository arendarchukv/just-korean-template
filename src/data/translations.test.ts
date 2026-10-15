import { describe, expect, it } from 'vitest';
import { sameShape } from '../i18n/localized';
import { languages } from '../i18n/ui';
import { CLASSES } from './classes';
import { PLAYLISTS } from './playlists';
import { TEACHER } from './teacher';

/** Every interface language beside English must have the hardcoded content too, item for item. */
const others = Object.keys(languages).filter((l) => l !== 'en') as (keyof typeof TEACHER)[];

describe('hardcoded content is translated', () => {
  for (const lang of others) {
    it(`teacher text in ${lang}`, () => {
      expect(TEACHER[lang], 'missing').toBeDefined();
      expect(sameShape(TEACHER.en, TEACHER[lang])).toEqual([]);
    });
    it(`classes in ${lang}`, () => {
      expect(CLASSES[lang], 'missing').toBeDefined();
      expect(sameShape(CLASSES.en, CLASSES[lang])).toEqual([]);
    });
    it(`playlists in ${lang}`, () => {
      for (const p of PLAYLISTS) {
        const text = p.text as Record<string, unknown>;
        expect(text[lang], p.id).toBeDefined();
        expect(sameShape(text.en, text[lang]), p.id).toEqual([]);
      }
    });
  }
});
