/**
 * Shared SVG geometry for the logo mark (82×100) and the cut-paper shapes (100×100 grid).
 * Used by Logo.astro and Shape.astro, and by scripts/generate-icons.ts to render PNG assets,
 * so icons and share images always match the site.
 */

/**
 * Logo mark, variant A: ㄱ + ㄴ rotated against each other, interlocking into an upright block, in
 * the proportions of her channel logo (82 wide × 100 tall; bars 20, uprights 22, equal gaps).
 */
export const LOGO_MARK_WIDTH = 82;
export const LOGO_MARK_PATHS = ['M0 0H82V66H60V20H0Z', 'M0 34H22V80H82V100H0Z'] as const;

/** Logo mark, variant B (rounded): polylines drawn with a 20-unit round stroke. */
export const LOGO_MARK_ROUNDED_POLYLINES = ['11,10 71,10 71,58', '11,42 11,90 71,90'] as const;

export const SHAPE_PATHS = {
  arch: 'M14 96 L16 44 C17 18 35 5 52 6 C70 7 86 21 86 45 L88 95 L66 96 L65 47 C65 35 59 28 51 28 C42 29 36 36 36 48 L35 95 Z',
  blob: 'M50 5 C66 3 82 9 91 23 C99 36 97 52 93 64 C88 80 76 93 57 96 C40 99 21 92 11 78 C2 65 3 47 8 34 C14 19 31 7 50 5 Z',
  zigzag:
    'M2 38 L14 22 L26 37 L38 21 L50 38 L62 22 L74 37 L86 21 L98 37 L98 63 L86 79 L74 62 L62 78 L50 62 L38 79 L26 62 L14 78 L2 62 Z',
  grid: 'M8 11 L91 6 L95 89 L6 94 Z',
} as const;

/** The wave is a stroked line (width 7, round caps), not a filled shape. */
export const WAVE_PATH = 'M4 58 C12 28 20 28 27 52 S41 78 49 52 S63 25 71 50 S87 76 96 42';
