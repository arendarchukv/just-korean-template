import { getRelativeLocaleUrl } from 'astro:i18n';
import { LOCALES } from './locales';
import { defaultLang, ui, type Lang, type UIKey } from './ui';

export function isLang(value: string | undefined): value is Lang {
  return value !== undefined && Object.hasOwn(LOCALES, value);
}

/** Locale from the first path segment; unprefixed paths are the default locale. */
export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  return isLang(first) ? first : defaultLang;
}

export function useTranslations(lang: Lang) {
  const dict: Partial<Record<UIKey, string>> = ui[lang];
  return function t(key: UIKey): string {
    // English is the complete dictionary and the fallback for every other locale.
    return dict[key] ?? ui.en[key];
  };
}

/** Path without the locale prefix, e.g. `/ko/classes/` -> `classes`. */
export function stripLocale(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isLang(parts[0])) parts.shift();
  return parts.join('/');
}

/** Localized URL for a locale-free path, e.g. localizePath('ko', 'classes') -> `/ko/classes/`. */
export function localizePath(lang: Lang, path = ''): string {
  return getRelativeLocaleUrl(lang, path);
}

/** The current page in another locale. A 404 page has no address of its own: its home. */
export function switchLocalePath(url: URL, target: Lang): string {
  const path = stripLocale(url.pathname);
  return localizePath(target, /^404(\.html)?$/.test(path) ? '' : path);
}

/** Dates in the page language (format from locales.ts). Content dates are UTC days. */
export function dateFormat(
  lang: Lang,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALES[lang].intl, { timeZone: 'UTC', ...options });
}
