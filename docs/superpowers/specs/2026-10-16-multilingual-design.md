# Many interface languages — design

Date: 2026-10-16. Agreed in chat: build the site for many languages at its base and add Spanish,
Indonesian and Ukrainian now (machine-drafted, marked for review), next to English and Korean.

## Decisions

- **One list of languages:** `src/i18n/locales.ts` (`LOCALES`: own name, Intl tag for dates, Open
  Graph locale, writing system), in language-menu order: English, 한국어, Español, Bahasa
  Indonesia, Українська. Astro i18n, the sitemap, hreflang, the 404 pages, the language menu, the
  checks and the tests all read it.
- **URLs:** English unprefixed (`/`), the others prefixed (`/ko/`, `/es/`, `/id/`, `/uk/`).
- **Routes:** one set of thin route files under `src/pages/[lang]/` (`langPaths`, `langItemPaths`
  in `src/i18n/routes.ts`) generates every prefixed language; English stays in `src/pages/`.
- **Dictionaries:** one file per language in `src/i18n/dict/`. English is complete and the
  fallback. `dictionaries.test.ts` fails on unknown keys (typos) and on missing strings, so a
  language ships complete.
- **Hardcoded content** (`teacher.ts`, `classes.ts`, `playlists.ts`) stays `{ en, ko, es, id, uk }`;
  `translations.test.ts` requires every language item for item.
- **Dates:** `dateFormat(lang, options)` in `src/i18n/utils.ts`, Intl tag from the list.
- **Fonts by writing system:** Outfit (Latin, also Spanish and Indonesian), Pretendard (Hangul),
  Manrope (Cyrillic; only its Cyrillic file from `@fontsource-variable/manrope`, declared inline
  in `BaseLayout` with its unicode-range, after Outfit in the stack, so only Cyrillic glyphs load it).
- **Pages CMS content stays single-language** (English with Korean examples).

## Adding a language later

1. Add it to `LOCALES` (and to `ui` in `src/i18n/ui.ts`, importing `src/i18n/dict/<code>.ts`).
2. Translate the dictionary and the hardcoded content until the two tests pass.
3. A new writing system needs its font in the stack (see Cyrillic above).
4. Add a few of its pages to `tests/a11y/pages.spec.ts`.
