import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cmsForms } from '../lib/cms-forms';
import { UNITS } from './site-info';

describe('Site info units (demo page)', () => {
  const forms = cmsForms(readFileSync('.pages.yml', 'utf8'));

  it('describe exactly the forms in Pages CMS', () => {
    expect(Object.keys(UNITS).sort()).toEqual(forms.map((f) => f.name).sort());
  });

  it('point only at other forms in the diagram', () => {
    for (const [name, unit] of Object.entries(UNITS)) {
      for (const ref of unit.refs) expect(Object.keys(UNITS), `${name} -> ${ref}`).toContain(ref);
    }
  });

  it('say where each one shows up, with the part it fills highlighted in every sketch', () => {
    for (const [name, unit] of Object.entries(UNITS)) {
      expect(unit.becomes.length, name).toBeGreaterThan(0);
      for (const sketch of unit.sketches) {
        expect(
          sketch.rows.some((r) => r.endsWith('*')),
          `${name}: ${sketch.title}`,
        ).toBe(true);
      }
    }
  });
});
