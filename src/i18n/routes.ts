import { PREFIXED_LANGS, type Lang } from './locales';

/** `getStaticPaths` for a page under `src/pages/[lang]/`: one page per prefixed language. */
export function langPaths() {
  return PREFIXED_LANGS.map((lang) => ({ params: { lang }, props: { lang } }));
}

/** Prefixed languages × items: `/ko/lessons/<id>/`, `/es/lessons/<id>/` ... */
export function langItemPaths<T extends { id: string }, K extends string>(items: T[], key: K) {
  return PREFIXED_LANGS.flatMap((lang) =>
    items.map((item) => ({
      params: { lang, id: item.id },
      props: { lang, [key]: item } as { lang: Lang } & Record<K, T>,
    })),
  );
}
