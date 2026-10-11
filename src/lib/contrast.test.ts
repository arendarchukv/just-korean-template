import { describe, expect, it } from 'vitest';
import { contrastRatio, normalizeHex, relativeLuminance } from './contrast';

describe('contrast', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });
  it('is symmetric and 1:1 for identical colors', () => {
    expect(contrastRatio('#3f5f9e', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#3f5f9e'),
      10,
    );
    expect(contrastRatio('#3f5f9e', '#3f5f9e')).toBe(1);
  });
  it('matches a known pair', () => {
    expect(contrastRatio('#FFFFFF', '#3F5F9E')).toBeCloseTo(6.28, 2);
  });
  it('accepts 3-digit and uppercase hex', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff');
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 10);
  });
  it('rejects non-hex input', () => {
    expect(() => relativeLuminance('rgb(0,0,0)')).toThrow(/hex/i);
  });
});
