import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DISPLAY_TEXT } from './display-text';
import { displayFontCss, slicesFor } from './display-font';

const source = readFileSync('node_modules/@fontsource/gowun-batang/700.css', 'utf8');

describe('display font', () => {
  it('finds the slices that hold given characters', () => {
    // 그 and 냥 are both in Korean slices; Latin letters are not part of any needed slice set here.
    const ids = slicesFor(source, '그냥');
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => /^\d+$/.test(id))).toBe(true);
  });

  it('src/styles/display-font.css covers exactly the display text (run `npm run fonts` after changing it)', () => {
    const committed = readFileSync('src/styles/display-font.css', 'utf8');
    expect(committed).toBe(displayFontCss(source, DISPLAY_TEXT.join('')));
  });

  it('keeps the display font CSS small', () => {
    expect(displayFontCss(source, DISPLAY_TEXT.join('')).length).toBeLessThan(4000);
  });
});
