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

  it('marks callouts with an inset straight bar, not a border bent by the corner radius', () => {
    expect(ruleBody(/\.callout/)).not.toMatch(/border-left/);
    const bar = ruleBody(/\.callout::before/);
    expect(bar).toMatch(/position:\s*absolute/);
    expect(bar).toMatch(/background-color:\s*var\(--callout-bar\)/);
  });

  it('draws the link hover hatch below the text (in bottom padding), not over descenders', () => {
    const link = ruleBody(/\.link/);
    expect(link).toMatch(/padding-bottom:\s*0\.25em/);
    expect(link).toMatch(/background-size:\s*0% 0\.2em/);
    expect(ruleBody(/\.link:hover/)).toMatch(/background-size:\s*100% 0\.2em/);
  });

  it('has a link-style button variant', () => {
    expect(ruleBody(/\.btn-link/)).toMatch(/color:\s*var\(--brand\)/);
  });
});
