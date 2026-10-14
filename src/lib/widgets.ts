/**
 * Small helpers for the practice widgets. Each widget keeps only its own progress in the
 * visitor's browser; storage may be blocked (private mode), so reads and writes never throw.
 */

const normalise = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

/** A typed answer is correct if it matches the answer or an alternative, ignoring spaces/case. */
export function isFillCorrect(input: string, answer: string, alternatives: string[] = []): boolean {
  const given = normalise(input);
  if (!given) return false;
  return [answer, ...alternatives].some((a) => normalise(a) === given);
}

/** Cards not yet known, in deck order. */
export function remainingCards<C extends { front: string }>(cards: C[], known: Set<string>): C[] {
  return cards.filter((c) => !known.has(c.front));
}

export const deckKey = (id: string) => `jk:deck:${id}`;
export const quizKey = (id: string) => `jk:quiz:${id}`;

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStore(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: progress is simply not kept.
  }
}
