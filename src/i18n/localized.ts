import type { Lang } from './ui';

/**
 * Hardcoded content (teacher text, classes, playlists) in every interface language. English is
 * complete; another language may be missing while it is being written, and then English shows.
 */
export type Localized<T> = { en: T } & Partial<Record<Exclude<Lang, 'en'>, T>>;

export function pick<T>(text: Localized<T>, lang: Lang): T {
  return (text as Partial<Record<Lang, T>>)[lang] ?? text.en;
}

/**
 * Differences between a translation and the English original: missing keys and lists of another
 * length (a forgotten FAQ item, an extra timeline stop). Values themselves are not compared.
 */
export function sameShape(original: unknown, translation: unknown, path = ''): string[] {
  const at = (key: string | number) => (path ? `${path}.${key}` : String(key));
  if (Array.isArray(original)) {
    if (!Array.isArray(translation)) return [`${path}: missing`];
    if (translation.length !== original.length) {
      return [`${path}: ${translation.length} items, expected ${original.length}`];
    }
    return original.flatMap((item, i) => sameShape(item, translation[i], at(i)));
  }
  if (original && typeof original === 'object') {
    const t = (translation ?? {}) as Record<string, unknown>;
    return Object.entries(original).flatMap(([key, value]) =>
      key in t ? sameShape(value, t[key], at(key)) : [`${at(key)}: missing`],
    );
  }
  return [];
}
