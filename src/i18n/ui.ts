/**
 * Interface dictionaries, one file per language in `./dict/`, and the language list re-exported
 * from `./locales.ts` (the single source of truth). Components import from here.
 */
import { en, type UIKey } from './dict/en';
import { es } from './dict/es';
import { id } from './dict/id';
import { ko } from './dict/ko';
import { uk } from './dict/uk';
import type { Dictionary } from './dict/types';
import { LANGS, LOCALES, defaultLang, type Lang } from './locales';

export { defaultLang, type Lang, type UIKey };

/** Language code → its own name, in menu order. */
export const languages = Object.fromEntries(LANGS.map((l) => [l, LOCALES[l].name])) as {
  [L in Lang]: (typeof LOCALES)[L]['name'];
};

export const ui: { en: typeof en } & Record<Exclude<Lang, 'en'>, Dictionary> = {
  en,
  ko,
  es,
  id,
  uk,
};
