/**
 * Every interface language, in the order of the language menu. Adding a language is one entry
 * here plus its dictionary (`src/i18n/dict/<code>.ts`) and the hardcoded content in `src/data/`
 * (teacher, classes, playlists; translations.test.ts says what is missing). Routes, the language
 * menu, hreflang, the sitemap, dates, the 404 pages and the checks all read this list.
 */
export const LOCALES = {
  en: { name: 'English', intl: 'en-GB', og: 'en_US', script: 'latin' },
  ko: { name: '한국어', intl: 'ko-KR', og: 'ko_KR', script: 'hangul' },
  es: { name: 'Español', intl: 'es-ES', og: 'es_ES', script: 'latin' },
  id: { name: 'Bahasa Indonesia', intl: 'id-ID', og: 'id_ID', script: 'latin' },
  uk: { name: 'Українська', intl: 'uk-UA', og: 'uk_UA', script: 'cyrillic' },
} as const satisfies Record<
  string,
  {
    /** The language's own name, shown in the language menu. */
    name: string;
    /** BCP 47 tag for dates and numbers (Intl). */
    intl: string;
    /** Open Graph locale for link previews. */
    og: string;
    /** Writing system: decides which font covers it (Cyrillic has its own font). */
    script: 'latin' | 'hangul' | 'cyrillic';
  }
>;

export type Lang = keyof typeof LOCALES;

/** English: unprefixed URLs (`/`), the complete dictionary and the fallback for missing keys. */
export const defaultLang = 'en' satisfies Lang;

export const LANGS = Object.keys(LOCALES) as Lang[];

/** Languages with a URL prefix (`/ko/`, `/es/` ...): the ones the `[lang]` routes generate. */
export const PREFIXED_LANGS = LANGS.filter((l) => l !== defaultLang);
