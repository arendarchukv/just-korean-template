import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrast';
import { parseThemeCss } from '../lib/theme-tokens';
import { CONTRAST_PAIRS } from './contrast-pairs';

const tokens = parseThemeCss(readFileSync(new URL('../styles/theme.css', import.meta.url), 'utf8'));

describe.each(['light', 'dark'] as const)('%s theme', (theme) => {
  it.each(CONTRAST_PAIRS)('$use ($fg on $bg) ≥ $min', ({ fg, bg, min }) => {
    const t = tokens[theme];
    expect(t[fg], `missing --${fg}`).toBeDefined();
    expect(t[bg], `missing --${bg}`).toBeDefined();
    expect(contrastRatio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(min);
  });
});
