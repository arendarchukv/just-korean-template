import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const global = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');
const prose = readFileSync(new URL('../styles/prose.css', import.meta.url), 'utf8');

describe('base finishing details', () => {
  it('avoids a lone word on the last line of paragraphs and list items', () => {
    expect(global).toMatch(/p,\s*li,\s*figcaption\s*\{\s*text-wrap:\s*pretty;/);
  });

  it('keeps jumped-to headings clear of the sticky header', () => {
    expect(global).toMatch(/scroll-padding-top:\s*5rem/);
  });

  it('removes the grey tap flash on mobile (focus and active states are styled)', () => {
    expect(global).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  });

  it('themes the scrollbar with semantic tokens', () => {
    expect(global).toMatch(/scrollbar-color:[^;]*var\(--/);
  });

  it('shows heading anchors on hover or focus, and faintly on touch screens', () => {
    expect(prose).toMatch(/\.prose \.heading-anchor::after\s*\{[^}]*content:\s*'#'/);
    expect(prose).toMatch(/:is\(h2, h3\):hover \.heading-anchor/);
    expect(prose).toMatch(/@media \(hover: none\)/);
  });
});
