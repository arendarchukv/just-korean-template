import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../styles/prose.css', import.meta.url), 'utf8');
const global = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');

function ruleBody(selector: RegExp): string {
  const m = new RegExp(`${selector.source}[^{]*\\{([^}]*)\\}`).exec(css);
  return m?.[1] ?? '';
}

describe('prose.css', () => {
  it('is imported by global.css', () => {
    expect(global).toMatch(/@import '\.\/prose\.css';/);
  });

  it('keeps a readable measure', () => {
    expect(ruleBody(/\.prose(?=\s*\{)/)).toMatch(/max-width:\s*68ch/);
  });

  it('never fakes italics for Hangul', () => {
    expect(ruleBody(/\.prose :lang\(ko\) em/)).toMatch(/font-style:\s*normal/);
  });

  it('marks list items with a teal dash instead of a bullet', () => {
    expect(ruleBody(/\.prose ul > li::before/)).toMatch(/background-color:\s*var\(--teal\)/);
  });

  it('scrolls wide tables inside their wrapper, not the page', () => {
    expect(ruleBody(/\.prose \.table-scroll/)).toMatch(/overflow-x:\s*auto/);
  });

  it('marks quotes with the straight bar, not a border bent by a radius', () => {
    expect(ruleBody(/\.prose blockquote/)).not.toMatch(/border-left/);
    expect(ruleBody(/\.prose blockquote::before/)).toMatch(/border-radius:\s*999px/);
  });

  it('gives table cells a minimum width, so narrow screens scroll instead of squeezing', () => {
    expect(ruleBody(/\.prose :is\(th, td\)(?=\s*\{)/)).toMatch(/min-width:\s*8em/);
  });

  it('never breaks Korean words, on any page (not only on Korean-language pages)', () => {
    expect(global).toMatch(/\n\s*:lang\(ko\) \{\s*word-break:\s*keep-all;/);
  });

  it('uses semantic tokens only (no raw hex)', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
