/**
 * Deterministic ids for inline SVG defs. A build renders pages in a fixed order,
 * so the same source always produces the same HTML (unlike random ids).
 */
let counter = 0;

export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** For tests. */
export function resetIds(): void {
  counter = 0;
}
