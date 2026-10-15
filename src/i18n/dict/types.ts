import type { UIKey } from './en';

/** A translation: any subset of the English keys (missing ones show in English). */
export type Dictionary = Partial<Record<UIKey, string>>;
