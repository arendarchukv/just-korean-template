// Writes src/styles/display-font.css: @font-face rules for only the serif glyphs the site uses.
// Run with `npm run fonts` after changing src/lib/display-text.ts.
import { readFileSync, writeFileSync } from 'node:fs';
import { displayFontCss } from '../src/lib/display-font.ts';
import { DISPLAY_TEXT } from '../src/lib/display-text.ts';

const source = readFileSync('node_modules/@fontsource/gowun-batang/700.css', 'utf8');
const css = displayFontCss(source, DISPLAY_TEXT.join(''));
writeFileSync('src/styles/display-font.css', css);
console.log(`display-font.css: ${(css.match(/@font-face/g) ?? []).length} slices`);
