import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../styles/signature.css', import.meta.url), 'utf8');

/** Body of the first rule whose selector list matches `selector`. */
function ruleBody(selector: RegExp): string {
  const m = new RegExp(`${selector.source}[^{]*\\{([^}]*)\\}`).exec(css);
  return m?.[1] ?? '';
}

describe('signature.css', () => {
  it('stops hover/press movement under reduced motion', () => {
    const reduce =
      /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(reduce).toMatch(/\.card-interactive:hover \.card-shape/);
    expect(reduce).toMatch(/\.btn:active/);
    expect(reduce).toMatch(/transform:\s*none/);
  });

  it('gives eyebrows a small cut-paper section mark', () => {
    expect(ruleBody(/\.eyebrow::before/)).toMatch(/mask/);
  });

  it('dims collages through a per-theme variable, so nested light panels stay undimmed', () => {
    expect(ruleBody(/\.collage/)).toMatch(/opacity:\s*var\(--collage-opacity\)/);
    expect(css).not.toMatch(/\[data-theme='dark'\] \.collage/);
  });

  it('does not apply hover fills to aria-disabled buttons', () => {
    for (const variant of ['primary', 'teal', 'ghost']) {
      expect(css).toMatch(
        new RegExp(
          `\\.btn-${variant}:not\\(:disabled\\):not\\(\\[aria-disabled='true'\\]\\):hover`,
        ),
      );
    }
  });

  it('has a link-style button variant', () => {
    expect(ruleBody(/\.btn-link/)).toMatch(/color:\s*var\(--brand\)/);
  });
});
