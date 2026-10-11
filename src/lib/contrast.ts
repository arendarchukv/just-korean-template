/** WCAG 2.x contrast helpers for #rgb / #rrggbb colors. */

export function normalizeHex(hex: string): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Expected a hex color (#rgb or #rrggbb), got "${hex}"`);
  const h = m[1]!.toLowerCase();
  return h.length === 3 ? `#${[...h].map((c) => c + c).join('')}` : `#${h}`;
}

export function relativeLuminance(hex: string): number {
  const h = normalizeHex(hex);
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}
