import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../styles/theme.css', import.meta.url), 'utf8');

// Spec §2 type scale, mapped onto Tailwind's size names.
const SPEC_SCALE: [string, string][] = [
  ['xs', '0.8125rem'],
  ['sm', '0.9375rem'],
  ['base', '1.0625rem'],
  ['lg', '1.25rem'],
  ['xl', '1.5rem'],
  ['2xl', '1.875rem'],
  ['3xl', '2.5rem'],
  ['4xl', '3.25rem'],
];

describe('type scale', () => {
  it('resets the Tailwind default sizes so only the spec scale exists', () => {
    expect(css).toMatch(/--text-\*:\s*initial;/);
  });
  it.each(SPEC_SCALE)('--text-%s is %s', (name, size) => {
    expect(css).toMatch(new RegExp(`--text-${name}:\\s*${size.replace('.', '\\.')};`));
  });
});
