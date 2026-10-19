// Renders PNG icons and the default share image from the SVG logo and cut-paper shapes.
// Run after changing the logo, shapes or brand colours: `npm run icons`. Output goes to public/.
// Colours are literal here (PNG files cannot read CSS variables); keep them in sync with
// src/styles/theme.css (brand-700, brand-500, teal-400, paper, shape tokens).
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  LOGO_MARK_PATHS,
  LOGO_MARK_WIDTH,
  SHAPE_PATHS,
  WAVE_PATH,
} from '../src/components/shapes/paths.ts';

const OUT = new URL('../public/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const COLOR = {
  brand700: '#3f5f9e',
  brand500: '#5c7ebe',
  brand400: '#7792c8',
  teal400: '#56a8a3',
  indigo: '#2b3a7a',
  paperShape: '#e3e7f4',
  ink: '#1f2a5c',
  bg: '#fbfbfd',
  white: '#ffffff',
};

/** The logo mark `size` px tall, centred in a `size` square whose top-left is (x, y). */
function mark(x: number, y: number, size: number, fill: string): string {
  const s = size / 100;
  const dx = (size - LOGO_MARK_WIDTH * s) / 2;
  return `<g transform="translate(${x + dx} ${y}) scale(${s})">${LOGO_MARK_PATHS.map(
    (d) => `<path d="${d}" fill="${fill}"/>`,
  ).join('')}</g>`;
}

/** App icon: white mark on a brand square. `markRatio` leaves room for maskable safe zones. */
function appIcon(size: number, markRatio: number): string {
  const m = size * markRatio;
  const o = (size - m) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${COLOR.brand700}"/>
  ${mark(o, o, m, COLOR.white)}
</svg>`;
}

type ShapeKey = keyof typeof SHAPE_PATHS;

/** A cut-paper shape at (x, y), `size` px, rotated `deg`, with an optional line texture. */
function shape(
  id: string,
  name: ShapeKey | 'wave',
  x: number,
  y: number,
  size: number,
  fill: string,
  texture: 'solid' | 'hatch' | 'grid' | 'scribble' = 'solid',
  deg = 0,
): string {
  const s = size / 100;
  const t = `translate(${x} ${y}) rotate(${deg} ${size / 2} ${size / 2}) scale(${s})`;
  if (name === 'wave') {
    return `<g transform="${t}"><path d="${WAVE_PATH}" fill="none" stroke="${fill}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  const d = SHAPE_PATHS[name];
  const line = `stroke="${COLOR.ink}" stroke-opacity="0.5"`;
  const pattern = {
    solid: '',
    hatch: `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" ${line} stroke-width="1.4"/></pattern>`,
    grid: `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M9 0H0V9" fill="none" ${line} stroke-width="1.1"/></pattern>`,
    scribble: `<pattern id="${id}" width="16" height="9" patternUnits="userSpaceOnUse"><path d="M0 4.5 Q4 0 8 4.5 T16 4.5" fill="none" ${line} stroke-width="1.2" stroke-linecap="round"/></pattern>`,
  }[texture];
  return `<g transform="${t}">${pattern ? `<defs>${pattern}</defs>` : ''}<path d="${d}" fill="${fill}"/>${
    pattern ? `<path d="${d}" fill="url(#${id})"/>` : ''
  }</g>`;
}

/** Share image (1200×630): the mark beside the hero collage, on paper. No text: the
 *  wordmark font is not final, and platforms show the page title next to the image. */
function shareImage(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${COLOR.bg}"/>
  ${mark(140, 195, 240, COLOR.brand500)}
  ${shape('g', 'grid', 560, 70, 250, COLOR.teal400, 'grid', -6)}
  ${shape('a', 'arch', 880, 40, 200, COLOR.indigo)}
  ${shape('b', 'blob', 700, 230, 270, COLOR.brand400, 'hatch')}
  ${shape('z', 'zigzag', 900, 330, 240, COLOR.paperShape, 'scribble', 12)}
  ${shape('w', 'wave', 520, 400, 220, COLOR.brand400)}
  ${shape('s', 'blob', 830, 170, 64, COLOR.teal400)}
</svg>`;
}

const jobs: [string, string][] = [
  ['apple-touch-icon.png', appIcon(180, 0.56)],
  ['icon-192.png', appIcon(192, 0.56)],
  ['icon-512.png', appIcon(512, 0.56)],
  ['icon-maskable-512.png', appIcon(512, 0.42)],
  ['og-default.png', shareImage()],
];

for (const [file, svg] of jobs) {
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(file, OUT)));
  console.log(`public/${file}`);
}
