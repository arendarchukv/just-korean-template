import { describe, expect, it } from 'vitest';
import { parseThemeCss } from './theme-tokens';

const CSS = `
@theme {
  --color-*: initial;
  --color-teal-500: #3E8E89; /* comment with { brace } */
  --radius-card: 1rem;
}
:root,
[data-theme='light'] {
  color-scheme: light;
  --bg: #FFF;
  --focus: var(--color-teal-500);
}
[data-theme='dark'] {
  --bg: #111733;
  --focus: var(--color-teal-500);
}
@theme inline {
  --color-bg: var(--bg);
}
`;

describe('parseThemeCss', () => {
  it('reads raw color scale entries only', () => {
    expect(parseThemeCss(CSS).raw).toEqual({ 'teal-500': '#3e8e89' });
  });
  it('reads light tokens from a combined :root selector and resolves var()', () => {
    expect(parseThemeCss(CSS).light).toEqual({ bg: '#ffffff', focus: '#3e8e89' });
  });
  it('reads dark tokens', () => {
    expect(parseThemeCss(CSS).dark).toEqual({ bg: '#111733', focus: '#3e8e89' });
  });
  it('throws on an unresolved var()', () => {
    expect(() =>
      parseThemeCss(CSS.replace('var(--color-teal-500);\n}', 'var(--color-nope);\n}')),
    ).toThrow(/color-nope/);
  });
});
