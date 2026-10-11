# Design System "Paper & cut-outs" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the template-looking Phase 1 styling with the "Paper & cut-outs" design system and show it on a `/styleguide` page.

**Architecture:** Tokens live in `src/styles/theme.css` (raw scales in `@theme`, semantic tokens per theme, exposed via `@theme inline`). Signature details are plain CSS classes in `src/styles/signature.css`. Decorative shapes are one SVG component with per-instance ids. A tested token parser + contrast function read `theme.css` so the styleguide table and a unit test both check real values.

**Tech Stack:** Astro 7, Tailwind CSS v4 (CSS-first), TypeScript 6 strict, Vitest 5 (new, dev only).

**Spec:** `docs/superpowers/specs/2026-10-11-design-system-design.md`

## Global Constraints

- Components use only semantic tokens, never raw hex or raw scale utilities (enforced: Tailwind default palette is reset with `--color-*: initial`).
- Every text/background pair ≥ 4.5:1; focus ring ≥ 3:1 against `bg` and `surface`, in both themes.
- White text never on brand-400/500 or teal-400/500.
- Irregular edges only in decorative shapes; decorative SVG is `aria-hidden="true"`.
- Motion 150–200ms ease-out, no springs; `prefers-reduced-motion: reduce` disables movement.
- User-facing UI strings go through `src/i18n/ui.ts`; the styleguide page is the documented exception (developer sample text).
- Cross-platform scripts only (developer on Windows). npm. No co-author trailer in commits.
- No content collections, feature pages, Svelte islands or deploy work.

## Review Focus

1. `/styleguide` is English-only: it must not emit `hreflang` alternates nor a language switch to a non-existent `/ko/styleguide` → Task 6 checks the built HTML.
2. A light-theme panel nested in a dark page (and vice versa) must show its own tokens → light tokens use `:root, [data-theme='light']`; parser test covers that selector (Task 1), visual check (Task 6).
3. Several shapes on one page must not share SVG `id`s (a texture/filter of one leaking into another) → Task 6 checks built HTML for duplicate ids.
4. Hex values written as `#FFF` / uppercase in `theme.css` must still be parsed and checked, not crash or be skipped → Task 1 tests.
5. Long Korean phrases in the bilingual pair at 375px must wrap without horizontal scroll → Task 7 visual check at mobile width.

---

## File map

| File                                  | Responsibility                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/lib/contrast.ts`                 | WCAG relative luminance + contrast ratio                                                                        |
| `src/lib/theme-tokens.ts`             | Parse `theme.css` text into raw / light / dark hex maps                                                         |
| `src/design/contrast-pairs.ts`        | List of semantic token pairs that must meet contrast                                                            |
| `src/styles/theme.css`                | Raw scales, semantic tokens per theme, Tailwind exposure                                                        |
| `src/styles/signature.css`            | Signature classes: link, key mark, grid paper, buttons, field, card, badge, callout, quiz, pair, shapes, motion |
| `src/styles/global.css`               | Imports + base layer                                                                                            |
| `src/components/shapes/Shape.astro`   | One decorative shape (5 names × 4 tones × 4 textures)                                                           |
| `src/components/shapes/Collage.astro` | Hero / compact compositions of shapes                                                                           |
| `src/components/SectionHeading.astro` | Heading with a small shape mark                                                                                 |
| `src/components/learn/*.astro`        | BilingualPair, KeyExpression, ExampleBlock, Callout, LevelBadge, QuizOption                                     |
| `src/components/styleguide/*.astro`   | Styleguide sections                                                                                             |
| `src/pages/styleguide.astro`          | The page                                                                                                        |

---

### Task 1: Test tooling, contrast and token parser

**Files:**

- Modify: `package.json` (devDependency `vitest`, script `test`)
- Create: `src/lib/contrast.ts`, `src/lib/contrast.test.ts`
- Create: `src/lib/theme-tokens.ts`, `src/lib/theme-tokens.test.ts`

**Interfaces:**

- Produces: `relativeLuminance(hex: string): number`, `contrastRatio(a: string, b: string): number`, `normalizeHex(hex: string): string` (lowercase `#rrggbb`), `parseThemeCss(css: string): ThemeTokens` where `ThemeTokens = { raw: Record<string, string>; light: Record<string, string>; dark: Record<string, string> }`. Raw keys drop the `--color-` prefix (`'teal-500'`); semantic keys drop `--` (`'bg'`).

- [ ] **Step 1: Install Vitest and add script**

Run: `npm i -D vitest@^5`
Then in `package.json` scripts add `"test": "vitest run"`.

- [ ] **Step 2: Write failing tests**

`src/lib/contrast.test.ts`:

```ts
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
```

`src/lib/theme-tokens.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests, expect FAIL** (modules missing)

Run: `npm test` → FAIL "Failed to resolve import './contrast'".

- [ ] **Step 4: Implement**

`src/lib/contrast.ts`:

```ts
/** WCAG 2.x contrast helpers for #rgb / #rrggbb colors. */

export function normalizeHex(hex: string): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Expected a hex color (#rgb or #rrggbb), got "${hex}"`);
  const h = m[1]!.toLowerCase();
  return h.length === 3 ? `#${[...h].map((c) => c + c).join('')}` : `#${h}`;
}

export function relativeLuminance(hex: string): number {
  const h = normalizeHex(hex);
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}
```

`src/lib/theme-tokens.ts`:

```ts
import { normalizeHex } from './contrast';

export interface ThemeTokens {
  raw: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
}

function block(css: string, selector: RegExp): string {
  const m = selector.exec(css);
  if (!m) throw new Error(`theme.css: block ${selector} not found`);
  return m[1]!;
}

function declarations(body: string): [string, string][] {
  return [...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]);
}

/** Parse src/styles/theme.css into hex maps. Only #hex and var(--color-*) values are supported. */
export function parseThemeCss(source: string): ThemeTokens {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');

  const raw: Record<string, string> = {};
  for (const [name, value] of declarations(block(css, /@theme\s*\{([^}]*)\}/))) {
    if (name.startsWith('color-') && value.startsWith('#')) {
      raw[name.slice('color-'.length)] = normalizeHex(value);
    }
  }

  const resolve = (value: string): string => {
    const ref = /^var\(--color-([\w-]+)\)$/.exec(value);
    if (ref) {
      const hex = raw[ref[1]!];
      if (!hex) throw new Error(`theme.css: unresolved var(--color-${ref[1]})`);
      return hex;
    }
    return normalizeHex(value);
  };

  const semantic = (body: string) =>
    Object.fromEntries(declarations(body).map(([name, value]) => [name, resolve(value)]));

  return {
    raw,
    light: semantic(block(css, /:root[^{]*\{([^}]*)\}/)),
    dark: semantic(block(css, /\[data-theme='dark'\]\s*\{([^}]*)\}/)),
  };
}
```

- [ ] **Step 5: Run tests, expect PASS**

Run: `npm test` → 9 passed. Also `npm run check` → 0 errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib
git commit -m "Add Vitest, WCAG contrast helpers and theme token parser"
```

---

### Task 2: New theme tokens with a contrast regression test

**Files:**

- Create: `src/design/contrast-pairs.ts`, `src/design/theme-contrast.test.ts`, `src/styles/theme.css`
- Modify: `src/styles/global.css` (move tokens out, import theme.css)

**Interfaces:**

- Consumes: `parseThemeCss`, `contrastRatio` (Task 1).
- Produces: `CONTRAST_PAIRS: ContrastPair[]`, `type ContrastPair = { fg: string; bg: string; min: number; use: string }`. Semantic token names (CSS vars and Tailwind colors): `bg surface border text muted brand brand-strong brand-strong-hover brand-tint on-brand teal teal-strong teal-strong-hover teal-tint on-teal danger danger-tint focus logo logo-secondary selection shape-brand shape-teal shape-indigo shape-paper shape-ink`. Theme extras: `--text-example`, `--text-body`, `--ease-calm`, `--radius-control`, `--radius-card`, `--spacing-touch`.

- [ ] **Step 1: Write the pairs and the failing test**

`src/design/contrast-pairs.ts`:

```ts
/** Semantic token pairs that must stay readable in both themes. */
export interface ContrastPair {
  fg: string;
  bg: string;
  min: number;
  use: string;
}

export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: 'text', bg: 'bg', min: 4.5, use: 'Body text' },
  { fg: 'text', bg: 'surface', min: 4.5, use: 'Text on paper' },
  { fg: 'muted', bg: 'bg', min: 4.5, use: 'Secondary text' },
  { fg: 'muted', bg: 'surface', min: 4.5, use: 'Secondary text on paper' },
  { fg: 'brand', bg: 'bg', min: 4.5, use: 'Links' },
  { fg: 'brand', bg: 'surface', min: 4.5, use: 'Links on paper' },
  { fg: 'brand', bg: 'brand-tint', min: 4.5, use: 'Brand badge' },
  { fg: 'on-brand', bg: 'brand-strong', min: 4.5, use: 'Primary button' },
  { fg: 'on-brand', bg: 'brand-strong-hover', min: 4.5, use: 'Primary button hover' },
  { fg: 'teal', bg: 'bg', min: 4.5, use: 'Learning accent text' },
  { fg: 'teal', bg: 'surface', min: 4.5, use: 'Learning accent on paper' },
  { fg: 'teal', bg: 'teal-tint', min: 4.5, use: 'Tip / correct label' },
  { fg: 'text', bg: 'teal-tint', min: 4.5, use: 'Text on tip / correct' },
  { fg: 'on-teal', bg: 'teal-strong', min: 4.5, use: 'Learning button' },
  { fg: 'on-teal', bg: 'teal-strong-hover', min: 4.5, use: 'Learning button hover' },
  { fg: 'danger', bg: 'bg', min: 4.5, use: 'Error text' },
  { fg: 'danger', bg: 'danger-tint', min: 4.5, use: 'Wrong answer label' },
  { fg: 'text', bg: 'selection', min: 4.5, use: 'Selected text' },
  { fg: 'focus', bg: 'bg', min: 3, use: 'Focus ring' },
  { fg: 'focus', bg: 'surface', min: 3, use: 'Focus ring on paper' },
];
```

`src/design/theme-contrast.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, expect FAIL** — `theme.css` does not exist yet.

Run: `npm test` → FAIL ENOENT theme.css.

- [ ] **Step 3: Create `src/styles/theme.css`**

```css
/* Raw palette. Components never use these directly; swap a scale here to rebrand. */
@theme {
  --color-*: initial;

  /* Brand: denim, from the logo #5C7EBE */
  --color-brand-50: #f1f4fa;
  --color-brand-100: #e2e8f4;
  --color-brand-200: #c5d1e8;
  --color-brand-300: #9db0d6;
  --color-brand-400: #7792c8;
  --color-brand-500: #5c7ebe;
  --color-brand-600: #4a68a6;
  --color-brand-700: #3f5f9e;
  --color-brand-800: #334c7e;
  --color-brand-900: #2a3e66;
  --color-brand-950: #1a2740;

  /* Teal: second color, from the channel intro #56A8A3 */
  --color-teal-50: #eef7f6;
  --color-teal-100: #d6edeb;
  --color-teal-200: #aedad6;
  --color-teal-300: #7fc6c0;
  --color-teal-400: #56a8a3;
  --color-teal-500: #3e8e89;
  --color-teal-600: #337a76;
  --color-teal-700: #2a6965;
  --color-teal-800: #22524f;
  --color-teal-900: #1a3e3c;
  --color-teal-950: #102826;

  --font-sans:
    'Outfit Variable', 'Pretendard Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
    'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  --font-korean:
    'Pretendard Variable', ui-sans-serif, system-ui, -apple-system, 'Apple SD Gothic Neo',
    'Malgun Gothic', sans-serif;

  --text-body: 1.0625rem;
  --text-body--line-height: 1.65;
  --text-example: 1.375rem;
  --text-example--line-height: 1.7;

  --radius-control: 0.75rem;
  --radius-card: 1.125rem;
  --spacing-touch: 2.75rem;
  --ease-calm: cubic-bezier(0.2, 0.7, 0.2, 1);
}

/* Light: paper and ink. Also applies to nested [data-theme='light'] panels. */
:root,
[data-theme='light'] {
  color-scheme: light;

  --bg: #fbfbfd;
  --surface: #eef0f8;
  --border: #dee2ef;
  --text: #1d2340;
  --muted: #4a5170;

  --brand: var(--color-brand-700);
  --brand-strong: var(--color-brand-700);
  --brand-strong-hover: var(--color-brand-800);
  --brand-tint: var(--color-brand-50);
  --on-brand: #ffffff;

  --teal: var(--color-teal-700);
  --teal-strong: var(--color-teal-700);
  --teal-strong-hover: var(--color-teal-800);
  --teal-tint: var(--color-teal-50);
  --on-teal: #ffffff;

  --danger: #b03a3a;
  --danger-tint: #fbeded;

  --focus: var(--color-teal-500);
  --selection: var(--color-teal-100);
  --logo: var(--color-brand-500);
  --logo-secondary: var(--color-brand-700);

  --shape-brand: var(--color-brand-400);
  --shape-teal: var(--color-teal-400);
  --shape-indigo: #2b3a7a;
  --shape-paper: #e3e7f4;
  --shape-ink: #1f2a5c;
}

/* Dark: deep indigo from the channel intro. */
[data-theme='dark'] {
  color-scheme: dark;

  --bg: #111733;
  --surface: #1a2246;
  --border: #2c3763;
  --text: #e8edfb;
  --muted: #a3adcf;

  --brand: var(--color-brand-300);
  --brand-strong: var(--color-brand-700);
  --brand-strong-hover: var(--color-brand-600);
  --brand-tint: #1f2a55;
  --on-brand: #ffffff;

  --teal: var(--color-teal-300);
  --teal-strong: var(--color-teal-700);
  --teal-strong-hover: var(--color-teal-600);
  --teal-tint: #173a44;
  --on-teal: #ffffff;

  --danger: #e58a8a;
  --danger-tint: #3a1f2a;

  --focus: var(--color-teal-300);
  --selection: var(--color-teal-800);
  --logo: var(--color-brand-300);
  --logo-secondary: var(--color-brand-500);

  --shape-brand: var(--color-brand-600);
  --shape-teal: var(--color-teal-600);
  --shape-indigo: #3a4a8c;
  --shape-paper: #222b55;
  --shape-ink: #0b1029;
}

/* Semantic tokens as Tailwind colors: bg-surface, text-muted, border-border, ... */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-muted: var(--muted);
  --color-brand: var(--brand);
  --color-brand-strong: var(--brand-strong);
  --color-brand-strong-hover: var(--brand-strong-hover);
  --color-brand-tint: var(--brand-tint);
  --color-on-brand: var(--on-brand);
  --color-teal: var(--teal);
  --color-teal-strong: var(--teal-strong);
  --color-teal-strong-hover: var(--teal-strong-hover);
  --color-teal-tint: var(--teal-tint);
  --color-on-teal: var(--on-teal);
  --color-danger: var(--danger);
  --color-danger-tint: var(--danger-tint);
  --color-focus: var(--focus);
  --color-logo: var(--logo);
  --color-logo-secondary: var(--logo-secondary);
}
```

- [ ] **Step 4: Slim `src/styles/global.css`** to imports + base (component classes move in Task 3; keep the old `@layer components` block for now so pages still render):

Replace the old `@theme`, `:root`, `[data-theme='dark']` and `@theme inline` blocks with:

```css
@import 'tailwindcss';
@import './theme.css';
```

keep `@custom-variant dark ...` and the existing `@layer base` / `@layer components` blocks; in them replace `--accent`/`--accent-hover`/`--on-accent` uses: delete `.btn-accent` rules entirely. In `::selection` use `background-color: var(--selection); color: var(--text);`.

- [ ] **Step 5: Run tests, expect PASS**

Run: `npm test` → all pass (40 pair checks + Task 1 tests). Run `npm run check && npm run build` → clean (grep `src` for `accent` must return nothing: `git grep -n accent -- src`).

- [ ] **Step 6: Commit**

```bash
git add src/styles src/design
git commit -m "Add Paper & cut-outs theme tokens with contrast regression test"
```

---

### Task 3: Signature CSS

**Files:**

- Create: `src/styles/signature.css`
- Modify: `src/styles/global.css` (import it; remove the old `@layer components` block, keep base)

**Interfaces:**

- Produces classes: `.link`, `.nav-link`, `.key-mark`, `.grid-paper`, `.btn`, `.btn-primary`, `.btn-teal`, `.btn-ghost`, `.icon-btn`, `.field`, `.card`, `.card-interactive`, `.card-shape`, `.badge`, `.badge-level` (`data-level="1|2|3"`), `.callout`, `.callout-tip`, `.callout-attention`, `.callout-title`, `.quiz-option` (`data-state="default|selected|correct|wrong"`), `.pair`, `.pair-ko`, `.pair-roman`, `.pair-tr`, `.collage`, `.shape`, `.container-page`, `.eyebrow`.

- [ ] **Step 1: Write `src/styles/signature.css`**

```css
/* Signature details of the "Paper & cut-outs" system. Semantic tokens only. */

@layer components {
  .container-page {
    margin-inline: auto;
    width: 100%;
    max-width: 72rem;
    padding-inline: 1.25rem;
  }
  @media (min-width: 48rem) {
    .container-page {
      padding-inline: 2rem;
    }
  }

  .eyebrow {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--teal);
  }

  /* Links: thin underline; on hover a teal pencil hatch slides in. */
  .link {
    color: var(--brand);
    text-decoration-line: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.22em;
    text-decoration-color: color-mix(in oklab, var(--brand) 45%, transparent);
    background-image: repeating-linear-gradient(-45deg, var(--teal) 0 1.5px, transparent 1.5px 4px);
    background-repeat: no-repeat;
    background-position: 0 100%;
    background-size: 0% 0.4em;
    transition:
      background-size 180ms var(--ease-calm),
      text-decoration-color 180ms var(--ease-calm);
  }
  .link:hover {
    background-size: 100% 0.4em;
    text-decoration-color: transparent;
  }

  .nav-link {
    display: inline-flex;
    min-height: var(--spacing-touch);
    align-items: center;
    border-radius: var(--radius-control);
    padding-inline: 0.75rem;
    font-weight: 500;
    color: var(--muted);
    background-image: repeating-linear-gradient(-45deg, var(--teal) 0 1.5px, transparent 1.5px 4px);
    background-repeat: no-repeat;
    background-position: 0.75rem calc(100% - 0.55rem);
    background-size: 0 0.3em;
    transition:
      background-size 180ms var(--ease-calm),
      color 150ms;
  }
  .nav-link:hover {
    color: var(--text);
  }
  .nav-link[aria-current='page'] {
    color: var(--text);
    background-size: calc(100% - 1.5rem) 0.3em;
  }

  /* Key expression: pencil hatch behind the lower part of the text. */
  .key-mark {
    background-color: transparent;
    color: inherit;
    background-image: repeating-linear-gradient(
      -45deg,
      color-mix(in oklab, var(--teal) 40%, transparent) 0 2px,
      transparent 2px 5px
    );
    background-repeat: no-repeat;
    background-position: 0 88%;
    background-size: 100% 0.42em;
    padding-inline: 0.08em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }

  /* 원고지 / intro grid under examples. */
  .grid-paper {
    background-color: var(--surface);
    background-image:
      linear-gradient(color-mix(in oklab, var(--brand) 8%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in oklab, var(--brand) 8%, transparent) 1px, transparent 1px);
    background-size: 1.5rem 1.5rem;
    background-position: -1px -1px;
  }

  .btn {
    display: inline-flex;
    min-height: var(--spacing-touch);
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: var(--radius-control);
    border: 1px solid transparent;
    padding-inline: 1.125rem;
    font-weight: 600;
    line-height: 1.2;
    transition:
      background-color 150ms var(--ease-calm),
      border-color 150ms var(--ease-calm),
      transform 150ms var(--ease-calm);
  }
  .btn:active {
    transform: translateY(1px);
  }
  .btn:disabled,
  .btn[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
    transform: none;
  }
  .btn-primary {
    background-color: var(--brand-strong);
    color: var(--on-brand);
  }
  .btn-primary:not(:disabled):hover {
    background-color: var(--brand-strong-hover);
  }
  .btn-teal {
    background-color: var(--teal-strong);
    color: var(--on-teal);
  }
  .btn-teal:not(:disabled):hover {
    background-color: var(--teal-strong-hover);
  }
  .btn-ghost {
    border-color: var(--border);
    color: var(--text);
  }
  .btn-ghost:not(:disabled):hover {
    background-color: var(--surface);
  }

  .icon-btn {
    display: inline-flex;
    width: var(--spacing-touch);
    height: var(--spacing-touch);
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-control);
    color: var(--muted);
  }
  .icon-btn:hover {
    background-color: var(--surface);
    color: var(--text);
  }

  .field {
    min-height: var(--spacing-touch);
    width: 100%;
    border-radius: var(--radius-control);
    border: 1px solid var(--border);
    background-color: var(--bg);
    padding-inline: 0.875rem;
    color: var(--text);
    transition: border-color 150ms var(--ease-calm);
  }
  .field::placeholder {
    color: var(--muted);
  }
  .field:hover {
    border-color: color-mix(in oklab, var(--brand) 40%, var(--border));
  }
  .field:focus-visible {
    border-color: var(--focus);
  }

  .card {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-card);
    border: 1px solid var(--border);
    background-color: var(--bg);
    padding: 1.5rem;
  }
  .card-interactive {
    transition: border-color 180ms var(--ease-calm);
  }
  .card-interactive:hover {
    border-color: color-mix(in oklab, var(--brand) 55%, var(--border));
  }
  .card-shape {
    transition: transform 200ms var(--ease-calm);
  }
  .card-interactive:hover .card-shape {
    transform: translate(3px, -3px) rotate(-4deg);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 999px;
    background-color: var(--brand-tint);
    padding: 0.2rem 0.65rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--brand);
  }
  .badge-level i {
    display: inline-block;
    width: 3px;
    border-radius: 1px;
    background-color: color-mix(in oklab, var(--brand) 30%, transparent);
  }
  .badge-level i:nth-child(1) {
    height: 6px;
  }
  .badge-level i:nth-child(2) {
    height: 9px;
  }
  .badge-level i:nth-child(3) {
    height: 12px;
  }
  .level-bars {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
  }
  .badge-level[data-level='1'] i:nth-child(-n + 1),
  .badge-level[data-level='2'] i:nth-child(-n + 2),
  .badge-level[data-level='3'] i:nth-child(-n + 3) {
    background-color: var(--brand);
  }

  .callout {
    border-radius: var(--radius-control);
    border-left: 3px solid;
    padding: 1rem 1.25rem;
  }
  .callout-title {
    margin-bottom: 0.25rem;
    font-weight: 600;
  }
  .callout-tip {
    border-color: var(--teal);
    background-color: var(--teal-tint);
  }
  .callout-tip .callout-title {
    color: var(--teal);
  }
  .callout-attention {
    border-color: var(--brand);
    background-color: var(--brand-tint);
  }
  .callout-attention .callout-title {
    color: var(--brand);
  }

  .quiz-option {
    display: flex;
    min-height: var(--spacing-touch);
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-radius: var(--radius-control);
    border: 1px solid var(--border);
    background-color: var(--bg);
    padding: 0.625rem 1rem;
    text-align: left;
    transition:
      border-color 150ms var(--ease-calm),
      background-color 150ms var(--ease-calm);
  }
  .quiz-option:hover {
    border-color: color-mix(in oklab, var(--brand) 45%, var(--border));
  }
  .quiz-option[data-state='selected'] {
    border-color: var(--brand);
    background-color: var(--brand-tint);
  }
  .quiz-option[data-state='correct'] {
    border-color: var(--teal);
    background-color: var(--teal-tint);
  }
  .quiz-option[data-state='wrong'] {
    border-color: var(--danger);
    background-color: var(--danger-tint);
  }
  .quiz-option[data-state='correct'] .quiz-icon {
    color: var(--teal);
  }
  .quiz-option[data-state='wrong'] .quiz-icon {
    color: var(--danger);
  }
  .quiz-option[data-state='selected'] .quiz-icon {
    color: var(--brand);
  }

  /* Bilingual pair: Korean line, translation below, teal rule on the left. */
  .pair {
    border-left: 2px solid var(--teal);
    padding-left: 1rem;
  }
  .pair-ko {
    font-family: var(--font-korean);
    font-size: var(--text-example);
    line-height: var(--text-example--line-height);
    font-weight: 500;
    word-break: keep-all;
    overflow-wrap: anywhere;
    color: var(--text);
  }
  .pair-roman {
    font-size: 0.875rem;
    color: var(--muted);
  }
  .pair-tr {
    margin-top: 0.125rem;
    color: var(--muted);
  }

  .shape {
    display: block;
  }
  .collage {
    pointer-events: none;
    user-select: none;
  }
  [data-theme='dark'] .collage {
    opacity: 0.85;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Update `src/styles/global.css`** to exactly:

```css
@import 'tailwindcss';
@import './theme.css';
@import './signature.css';

/* Dark mode follows the resolved theme on <html data-theme>, set by the inline head script. */
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));

@layer base {
  html {
    background-color: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    -webkit-text-size-adjust: 100%;
    text-rendering: optimizeLegibility;
  }

  body {
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
  }

  /* Korean pages: Pretendard for everything, so Latin and Hangul share metrics. */
  html:lang(ko) {
    font-family: var(--font-korean);
    word-break: keep-all;
  }

  h1,
  h2,
  h3 {
    text-wrap: balance;
    letter-spacing: -0.015em;
  }

  :focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 3px;
  }

  ::selection {
    background-color: var(--selection);
    color: var(--text);
  }

  @media (prefers-reduced-motion: no-preference) {
    html {
      scroll-behavior: smooth;
    }
  }
}
```

- [ ] **Step 3: Verify**

Run: `npm test && npm run check && npm run build` → all clean. Header/footer still render (they use `.btn`, `.icon-btn`, `.container-page`, which moved).

- [ ] **Step 4: Commit**

```bash
git add src/styles
git commit -m "Add signature CSS: hatch links, key mark, grid paper, controls, quiz, pair"
```

---

### Task 4: Shapes and collage

**Files:**

- Create: `src/components/shapes/Shape.astro`, `src/components/shapes/Collage.astro`

**Interfaces:**

- Produces: `<Shape name tone? texture? rough? class? />` with `name: 'arch' | 'blob' | 'zigzag' | 'grid' | 'wave'`, `tone: 'brand' | 'teal' | 'indigo' | 'paper'` (default `'teal'`), `texture: 'solid' | 'hatch' | 'grid' | 'scribble'` (default `'solid'`), `rough: boolean` (default `true`). `<Collage variant? class? />` with `variant: 'hero' | 'compact'` (default `'hero'`). Both render `aria-hidden="true"`. Types exported from Shape.astro: `ShapeName`, `ShapeTone`, `ShapeTexture`.

- [ ] **Step 1: Write `src/components/shapes/Shape.astro`**

```astro
---
/**
 * Decorative cut-paper shape in the spirit of the channel intro.
 * Each instance gets its own ids so textures and filters never collide.
 */
export type ShapeName = 'arch' | 'blob' | 'zigzag' | 'grid' | 'wave';
export type ShapeTone = 'brand' | 'teal' | 'indigo' | 'paper';
export type ShapeTexture = 'solid' | 'hatch' | 'grid' | 'scribble';

interface Props {
  name: ShapeName;
  tone?: ShapeTone;
  texture?: ShapeTexture;
  /** Slightly displaced, hand-cut edges. */
  rough?: boolean;
  class?: string;
}

const { name, tone = 'teal', texture = 'solid', rough = true, class: className } = Astro.props;

const PATHS: Record<Exclude<ShapeName, 'wave'>, string> = {
  arch: 'M14 96 L16 44 C17 18 35 5 52 6 C70 7 86 21 86 45 L88 95 L66 96 L65 47 C65 35 59 28 51 28 C42 29 36 36 36 48 L35 95 Z',
  blob: 'M50 5 C66 3 82 9 91 23 C99 36 97 52 93 64 C88 80 76 93 57 96 C40 99 21 92 11 78 C2 65 3 47 8 34 C14 19 31 7 50 5 Z',
  zigzag:
    'M2 38 L14 22 L26 37 L38 21 L50 38 L62 22 L74 37 L86 21 L98 37 L98 63 L86 79 L74 62 L62 78 L50 62 L38 79 L26 62 L14 78 L2 62 Z',
  grid: 'M8 11 L91 6 L95 89 L6 94 Z',
};
const WAVE = 'M4 58 C12 28 20 28 27 52 S41 78 49 52 S63 25 71 50 S87 76 96 42';

const uid = `shape-${crypto.randomUUID().slice(0, 8)}`;
const fill = `fill: var(--shape-${tone})`;
const lineStyle = 'stroke: var(--shape-ink); stroke-opacity: 0.5';
---

<svg
  viewBox="0 0 100 100"
  class:list={['shape', className]}
  aria-hidden="true"
  focusable="false"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    {rough && (
      <filter id={`${uid}-rough`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="2.5" />
      </filter>
    )}
    {texture === 'hatch' && (
      <pattern
        id={`${uid}-tex`}
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="5" style={lineStyle} stroke-width="1.4" />
      </pattern>
    )}
    {texture === 'grid' && (
      <pattern id={`${uid}-tex`} width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M9 0H0V9" fill="none" style={lineStyle} stroke-width="1.1" />
      </pattern>
    )}
    {texture === 'scribble' && (
      <pattern id={`${uid}-tex`} width="16" height="9" patternUnits="userSpaceOnUse">
        <path d="M0 4.5 Q4 0 8 4.5 T16 4.5" fill="none" style={lineStyle} stroke-width="1.2" />
      </pattern>
    )}
  </defs>
  <g filter={rough ? `url(#${uid}-rough)` : undefined}>
    {name === 'wave' ? (
      <path
        d={WAVE}
        fill="none"
        style={`stroke: var(--shape-${tone})`}
        stroke-width="7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    ) : (
      <>
        <path d={PATHS[name]} style={fill} />
        {texture !== 'solid' && <path d={PATHS[name]} fill={`url(#${uid}-tex)`} />}
      </>
    )}
  </g>
</svg>
```

- [ ] **Step 2: Write `src/components/shapes/Collage.astro`**

```astro
---
/** Cut-paper collage. Only for the home hero, 404 and empty states. Decorative. */
import Shape from './Shape.astro';

interface Props {
  variant?: 'hero' | 'compact';
  class?: string;
}

const { variant = 'hero', class: className } = Astro.props;
---

<div
  class:list={[
    'collage relative',
    variant === 'hero' ? 'aspect-[5/4] w-full' : 'aspect-square w-full',
    className,
  ]}
  aria-hidden="true"
>
  {variant === 'hero' ? (
    <>
      <Shape
        name="grid"
        tone="teal"
        texture="grid"
        class="absolute top-[6%] left-[2%] w-[44%] -rotate-6"
      />
      <Shape name="arch" tone="indigo" class="absolute top-0 right-[6%] w-[34%]" />
      <Shape
        name="blob"
        tone="brand"
        texture="hatch"
        class="absolute top-[34%] left-[28%] w-[46%]"
      />
      <Shape
        name="zigzag"
        tone="paper"
        texture="scribble"
        class="absolute right-0 bottom-[8%] w-[42%] rotate-12"
      />
      <Shape name="wave" tone="brand" class="absolute bottom-[2%] left-0 w-[38%]" />
      <Shape name="blob" tone="teal" class="absolute top-[22%] right-[34%] w-[11%]" />
    </>
  ) : (
    <>
      <Shape name="blob" tone="paper" texture="grid" class="absolute inset-[8%]" />
      <Shape
        name="arch"
        tone="teal"
        texture="hatch"
        class="absolute top-[10%] right-[8%] w-[42%]"
      />
      <Shape name="wave" tone="brand" class="absolute bottom-[10%] left-[6%] w-[50%]" />
    </>
  )}
</div>
```

- [ ] **Step 3: Verify** — `npm run check` → 0 errors (components unused yet; rendering verified in Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/components/shapes
git commit -m "Add cut-paper Shape and Collage components"
```

---

### Task 5: Learning pattern components and section heading

**Files:**

- Create: `src/components/SectionHeading.astro`
- Create: `src/components/learn/BilingualPair.astro`, `KeyExpression.astro`, `ExampleBlock.astro`, `Callout.astro`, `LevelBadge.astro`, `QuizOption.astro`

**Interfaces:**

- Consumes: `Shape`, `ShapeName`, `ShapeTone` (Task 4); classes from Task 3.
- Produces:
  - `<SectionHeading as? shape? tone? id? class?>` slot = heading text; `as: 'h2' | 'h3'` (default `'h2'`), `shape: ShapeName` (default `'blob'`), `tone: ShapeTone` (default `'teal'`).
  - `<BilingualPair ko? translation romanization?>` with optional named slot `ko` (overrides `ko` prop, e.g. to include `KeyExpression`).
  - `<KeyExpression>` slot.
  - `<ExampleBlock class?>` slot.
  - `<Callout tone title>` `tone: 'tip' | 'attention'`, slot = body.
  - `<LevelBadge level label>` `level: 1 | 2 | 3`.
  - `<QuizOption state? stateLabel?>` slot = option text, `state: 'default' | 'selected' | 'correct' | 'wrong'`.

- [ ] **Step 1: Write the components**

`src/components/SectionHeading.astro`:

```astro
---
import Shape, { type ShapeName, type ShapeTone } from '@/components/shapes/Shape.astro';

interface Props {
  as?: 'h2' | 'h3';
  shape?: ShapeName;
  tone?: ShapeTone;
  id?: string;
  class?: string;
}

const { as: Tag = 'h2', shape = 'blob', tone = 'teal', id, class: className } = Astro.props;
---

<Tag
  id={id}
  class:list={[
    'flex items-center gap-3 font-bold tracking-tight',
    Tag === 'h2' ? 'text-2xl md:text-3xl' : 'text-xl',
    className,
  ]}
>
  <Shape name={shape} tone={tone} class="size-[0.8em] shrink-0" />
  <span>
    <slot />
  </span>
</Tag>
```

`src/components/learn/BilingualPair.astro`:

```astro
---
/** Signature pattern: Korean line, translation beneath (as in the channel subtitles). */
interface Props {
  ko?: string;
  translation: string;
  romanization?: string;
}

const { ko, translation, romanization } = Astro.props;
---

<figure class="pair">
  <p class="pair-ko" lang="ko">
    <slot name="ko">{ko}</slot>
  </p>
  {romanization && <p class="pair-roman">{romanization}</p>}
  <figcaption class="pair-tr">{translation}</figcaption>
</figure>
```

`src/components/learn/KeyExpression.astro`:

```astro
---
/** Pencil-hatch mark on a key Korean expression. */
---

<mark class="key-mark">
  <slot />
</mark>
```

`src/components/learn/ExampleBlock.astro`:

```astro
---
interface Props {
  class?: string;
}
const { class: className } = Astro.props;
---

<div class:list={['grid-paper flex flex-col gap-6 rounded-card p-6 md:p-8', className]}>
  <slot />
</div>
```

`src/components/learn/Callout.astro`:

```astro
---
interface Props {
  tone: 'tip' | 'attention';
  title: string;
}
const { tone, title } = Astro.props;
---

<aside class:list={['callout', `callout-${tone}`]}>
  <p class="callout-title">{title}</p>
  <div class="text-text">
    <slot />
  </div>
</aside>
```

`src/components/learn/LevelBadge.astro`:

```astro
---
interface Props {
  level: 1 | 2 | 3;
  label: string;
}
const { level, label } = Astro.props;
---

<span class="badge badge-level" data-level={level}>
  <span class="level-bars" aria-hidden="true">
    <i></i>
    <i></i>
    <i></i>
  </span>
  {label}
</span>
```

`src/components/learn/QuizOption.astro`:

```astro
---
/** Visual quiz option. State is shown by color, icon and (optionally) screen-reader text. */
interface Props {
  state?: 'default' | 'selected' | 'correct' | 'wrong';
  stateLabel?: string;
}
const { state = 'default', stateLabel } = Astro.props;
---

<button type="button" class="quiz-option" data-state={state} aria-pressed={state !== 'default'}>
  <span>
    <slot />
  </span>
  <span
    class="quiz-icon inline-flex size-5 shrink-0 items-center justify-center"
    aria-hidden="true"
  >
    {state === 'correct' && (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-5"
      >
        <path d="M4 10.5l4 4 8-9" />
      </svg>
    )}
    {state === 'wrong' && (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        class="size-5"
      >
        <path d="M5 5l10 10M15 5L5 15" />
      </svg>
    )}
    {state === 'selected' && <span class="size-2.5 rounded-full bg-brand" />}
  </span>
  {stateLabel && <span class="sr-only">{stateLabel}</span>}
</button>
```

- [ ] **Step 2: Verify** — `npm run check` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SectionHeading.astro src/components/learn
git commit -m "Add learning pattern components: pair, key mark, example block, callout, badge, quiz option"
```

---

### Task 6: `/styleguide` page

**Files:**

- Modify: `src/layouts/BaseLayout.astro` (prop `monolingual`), `src/components/Header.astro` (prop `showLanguageSwitch`), `astro.config.mjs` (sitemap filter)
- Create: `src/components/styleguide/SgSection.astro`, `ColorsSection.astro`, `TypeSection.astro`, `ControlsSection.astro`, `PatternsSection.astro`, `ShapesSection.astro`
- Create: `src/pages/styleguide.astro`
- Create: `scripts/check-styleguide.mjs` (built-HTML checks for Review Focus 1 and 3)

**Interfaces:**

- Consumes: everything from Tasks 1–5.
- Produces: BaseLayout `monolingual?: boolean` (no hreflang, no language switch); Header `showLanguageSwitch?: boolean` (default `true`); npm script `check:styleguide`.

- [ ] **Step 1: Write the failing built-HTML check** `scripts/check-styleguide.mjs`:

```js
// Checks the built /styleguide page: English-only and no duplicate SVG ids.
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dist/styleguide/index.html', import.meta.url), 'utf8');
const problems = [];

if (/hreflang=/.test(html)) problems.push('emits hreflang links');
if (/href="\/ko\/styleguide/.test(html)) problems.push('links to /ko/styleguide');
if (!/name="robots" content="noindex"/.test(html)) problems.push('missing noindex');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (dupes.length) problems.push(`duplicate ids: ${dupes.join(', ')}`);

const sitemap = readFileSync(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf8');
if (sitemap.includes('/styleguide')) problems.push('listed in sitemap');

if (problems.length) {
  console.error(`styleguide check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('styleguide check passed');
```

Add script: `"check:styleguide": "node scripts/check-styleguide.mjs"`.
Run: `npm run build && npm run check:styleguide` → FAIL (ENOENT: no styleguide page yet).

- [ ] **Step 2: Layout and header props**

In `src/layouts/BaseLayout.astro` Props add:

```ts
  /** Page exists in one language only: no hreflang alternates, no language switch. */
  monolingual?: boolean;
```

destructure `monolingual = false`, change the two hreflang lines to render only when `!noindex && !monolingual`, and render `<Header lang={lang} showLanguageSwitch={!monolingual} />`.

In `src/components/Header.astro` Props add `showLanguageSwitch?: boolean;`, destructure `const { lang, showLanguageSwitch = true } = Astro.props;` and wrap: `{showLanguageSwitch && <LanguageSwitcher lang={lang} />}`.

In `astro.config.mjs` sitemap options add:

```js
      filter: (page) => !new URL(page).pathname.startsWith('/styleguide'),
```

- [ ] **Step 3: Section wrapper** `src/components/styleguide/SgSection.astro`:

```astro
---
import SectionHeading from '@/components/SectionHeading.astro';
import type { ShapeName } from '@/components/shapes/Shape.astro';

interface Props {
  id: string;
  title: string;
  shape?: ShapeName;
  lead?: string;
}
const { id, title, shape = 'blob', lead } = Astro.props;
---

<section id={id} class="scroll-mt-24 border-t border-border py-14" aria-labelledby={`${id}-title`}>
  <SectionHeading id={`${id}-title`} shape={shape}>
    {title}
  </SectionHeading>
  {lead && <p class="mt-3 max-w-2xl text-muted">{lead}</p>}
  <div class="mt-8">
    <slot />
  </div>
</section>
```

- [ ] **Step 4: Colors** `src/components/styleguide/ColorsSection.astro`:

```astro
---
import themeCss from '@/styles/theme.css?raw';
import { contrastRatio } from '@/lib/contrast';
import { parseThemeCss } from '@/lib/theme-tokens';
import { CONTRAST_PAIRS } from '@/design/contrast-pairs';
import SgSection from './SgSection.astro';

const tokens = parseThemeCss(themeCss);
const scales = ['brand', 'teal'].map((scale) => ({
  scale,
  steps: Object.entries(tokens.raw).filter(([k]) => k.startsWith(`${scale}-`)),
}));
const SWATCHES = [
  'bg',
  'surface',
  'border',
  'text',
  'muted',
  'brand',
  'brand-strong',
  'brand-tint',
  'teal',
  'teal-strong',
  'teal-tint',
  'danger',
  'danger-tint',
  'focus',
];
const themes = (['light', 'dark'] as const).map((theme) => ({
  theme,
  rows: CONTRAST_PAIRS.map((p) => {
    const ratio = contrastRatio(tokens[theme][p.fg]!, tokens[theme][p.bg]!);
    return { ...p, ratio, pass: ratio >= p.min };
  }),
}));
---

<SgSection
  id="colors"
  title="Color"
  shape="grid"
  lead="Raw scales are for the theme file only. Components use the semantic tokens below. Ratios are computed from src/styles/theme.css at build time."
>
  <div class="flex flex-col gap-6">
    {scales.map(({ scale, steps }) => (
      <div>
        <p class="mb-2 text-sm font-semibold capitalize">{scale}</p>
        <div class="grid grid-cols-6 gap-1 sm:grid-cols-11">
          {steps.map(([name, hex]) => (
            <div>
              <div class="h-12 rounded-control border border-border" style={`background:${hex}`} />
              <p class="mt-1 text-xs text-muted">{name.split('-')[1]}</p>
              <p class="font-mono text-[0.7rem] text-muted">{hex}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>

  <div class="mt-10 grid gap-6 lg:grid-cols-2">
    {themes.map(({ theme, rows }) => (
      <div data-theme={theme} class="rounded-card border border-border bg-bg p-5 text-text">
        <p class="mb-4 font-semibold capitalize">{theme} theme</p>
        <div class="mb-5 grid grid-cols-7 gap-1">
          {SWATCHES.map((t) => (
            <div title={t}>
              <div class="h-9 rounded-md border border-border" style={`background:var(--${t})`} />
              <p class="mt-1 truncate text-[0.65rem] text-muted">{t}</p>
            </div>
          ))}
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted">
              <th class="py-1 font-medium">Pair</th>
              <th class="py-1 font-medium">Sample</th>
              <th class="py-1 text-right font-medium">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr class="border-t border-border">
                <td class="py-1.5 pr-2">{r.use}</td>
                <td class="py-1.5">
                  <span
                    class="rounded px-1.5 py-0.5 font-semibold"
                    style={`color:var(--${r.fg});background:var(--${r.bg})`}
                  >
                    Aa 가
                  </span>
                </td>
                <td
                  class:list={['py-1.5 text-right font-mono', r.pass ? 'text-teal' : 'text-danger']}
                >
                  {r.ratio.toFixed(2)} {r.pass ? '✓' : '✗'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
</SgSection>
```

- [ ] **Step 5: Typography** `src/components/styleguide/TypeSection.astro`:

```astro
---
import SgSection from './SgSection.astro';
const SCALE = [
  ['text-5xl', '3 rem'],
  ['text-4xl', '2.25 rem'],
  ['text-3xl', '1.875 rem'],
  ['text-2xl', '1.5 rem'],
  ['text-xl', '1.25 rem'],
  ['text-base', '1 rem'],
  ['text-sm', '0.875 rem'],
] as const;
---

<SgSection
  id="type"
  title="Typography"
  shape="arch"
  lead="Outfit for Latin, Pretendard for Korean. Body 17px / 1.65, Korean examples 22px / 1.7."
>
  <div class="grid gap-10 lg:grid-cols-2">
    <div class="flex flex-col gap-3">
      {SCALE.map(([cls, size]) => (
        <p class:list={[cls, 'font-bold tracking-tight']}>
          Learn Korean{' '}
          <span class="text-sm font-normal text-muted">
            {cls} · {size}
          </span>
        </p>
      ))}
    </div>
    <div lang="ko" class="flex flex-col gap-3" style="font-family: var(--font-korean)">
      {SCALE.map(([cls]) => (
        <p class:list={[cls, 'font-bold tracking-tight']}>한국어 배우기</p>
      ))}
    </div>
  </div>
  <div class="mt-10 grid gap-8 lg:grid-cols-2">
    <p class="max-w-[68ch]">
      Body text is 17px with a 1.65 line height and a measure of about 68 characters, so long
      explanations stay comfortable to read. Secondary text uses the{' '}
      <span class="text-muted">muted ink</span>.
    </p>
    <p lang="ko" class="max-w-[40em]" style="font-family: var(--font-korean)">
      본문은 읽기 편하도록 줄 간격을 넉넉하게 두었어요. 한국어 예문은 더 크게 보여 줘요.
    </p>
  </div>
</SgSection>
```

- [ ] **Step 6: Controls** `src/components/styleguide/ControlsSection.astro`:

```astro
---
import SgSection from './SgSection.astro';
---

<SgSection
  id="controls"
  title="Links and controls"
  shape="zigzag"
  lead="Hover the links and buttons; use Tab to see the teal focus ring."
>
  <p class="max-w-[68ch]">
    A sentence with an{' '}
    <a href="#controls" class="link">
      inline link
    </a>{' '}
    and
    <a href="#patterns" class="link">
      another one
    </a>
    : the underline turns into a pencil hatch on hover.
  </p>
  <div class="mt-8 flex flex-wrap items-center gap-3">
    <button type="button" class="btn btn-primary">
      Primary
    </button>
    <button type="button" class="btn btn-teal">
      Check answer
    </button>
    <button type="button" class="btn btn-ghost">
      Ghost
    </button>
    <button type="button" class="btn btn-primary" disabled>
      Disabled
    </button>
    <button type="button" class="icon-btn" aria-label="Icon button">
      <svg
        viewBox="0 0 24 24"
        class="size-5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M12 5v14" />
      </svg>
    </button>
  </div>
  <div class="mt-8 max-w-sm">
    <label for="sg-field" class="mb-1.5 block text-sm font-medium">
      Search a pattern
    </label>
    <input id="sg-field" type="text" class="field" placeholder="e.g. 아/어 봤자" />
  </div>
</SgSection>
```

- [ ] **Step 7: Patterns** `src/components/styleguide/PatternsSection.astro`:

```astro
---
import BilingualPair from '@/components/learn/BilingualPair.astro';
import Callout from '@/components/learn/Callout.astro';
import ExampleBlock from '@/components/learn/ExampleBlock.astro';
import KeyExpression from '@/components/learn/KeyExpression.astro';
import LevelBadge from '@/components/learn/LevelBadge.astro';
import QuizOption from '@/components/learn/QuizOption.astro';
import Shape from '@/components/shapes/Shape.astro';
import SgSection from './SgSection.astro';
---

<SgSection
  id="patterns"
  title="Learning patterns"
  shape="blob"
  lead="Learning text always sits on clean paper. Decoration stays at the edges."
>
  <div class="grid gap-4 sm:grid-cols-2">
    <a href="#patterns" class="card card-interactive block">
      <Shape
        name="arch"
        tone="teal"
        texture="hatch"
        class="card-shape absolute -top-3 -right-3 w-20"
      />
      <LevelBadge level={1} label="Beginner" />
      <p class="mt-3 text-lg font-semibold">Card title</p>
      <p class="mt-1 text-muted">Interactive card: the shape nudges on hover.</p>
    </a>
    <div class="card">
      <div class="flex flex-wrap gap-2">
        <LevelBadge level={1} label="Beginner" />
        <LevelBadge level={2} label="Intermediate" />
        <LevelBadge level={3} label="Advanced" />
        <span class="badge">Tag</span>
      </div>
      <p class="mt-3 text-muted">Static card with level badges.</p>
    </div>
  </div>

  <div class="mt-8 grid gap-4 md:grid-cols-2">
    <Callout tone="tip" title="Tip">
      Use 아/어 봤자 when the result will be the same anyway.
    </Callout>
    <Callout tone="attention" title="Attention">
      Don't confuse it with (으)나 마나.
    </Callout>
  </div>

  <ExampleBlock class="mt-8">
    <BilingualPair
      translation="Even if you hurry, you won't make it in time."
      romanization="seo-dul-leo bwat-ja je-si-gan-e mot ga-yo"
    >
      <Fragment slot="ko">
        서둘러 <KeyExpression>봤자</KeyExpression> 제시간에 못 가요.
      </Fragment>
    </BilingualPair>
    <BilingualPair
      ko="지금 가 봤자 아무도 없을 거예요. 그러니까 내일 아침에 일찍 다시 가 보는 게 어때요?"
      translation="Even if you go now, nobody will be there. So why not go back early tomorrow morning?"
    />
  </ExampleBlock>

  <div class="mt-8 grid max-w-xl gap-2">
    <QuizOption>먹어 봤자</QuizOption>
    <QuizOption state="selected" stateLabel="Selected">
      먹으나 마나
    </QuizOption>
    <QuizOption state="correct" stateLabel="Correct">
      먹어 봤자
    </QuizOption>
    <QuizOption state="wrong" stateLabel="Wrong">
      먹고 나서
    </QuizOption>
  </div>
</SgSection>
```

- [ ] **Step 8: Shapes and logo** `src/components/styleguide/ShapesSection.astro`:

```astro
---
import Logo from '@/components/Logo.astro';
import Collage from '@/components/shapes/Collage.astro';
import Shape, {
  type ShapeName,
  type ShapeTexture,
  type ShapeTone,
} from '@/components/shapes/Shape.astro';
import SgSection from './SgSection.astro';

const NAMES: ShapeName[] = ['arch', 'blob', 'zigzag', 'grid', 'wave'];
const TEXTURES: ShapeTexture[] = ['solid', 'hatch', 'grid', 'scribble'];
const TONES: ShapeTone[] = ['brand', 'teal', 'indigo', 'paper'];
---

<SgSection
  id="shapes"
  title="Shapes, collage and logo"
  shape="wave"
  lead="Drawn in the spirit of the channel intro. Collage only in the hero, 404 and empty states."
>
  <div class="grid grid-cols-5 gap-4">
    {NAMES.map((name) => (
      <div class="flex flex-col items-center gap-2">
        <Shape
          name={name}
          tone="teal"
          texture={name === 'grid' ? 'grid' : 'solid'}
          class="w-full max-w-24"
        />
        <p class="text-xs text-muted">{name}</p>
      </div>
    ))}
  </div>
  <div class="mt-8 grid grid-cols-4 gap-4">
    {TEXTURES.map((texture, i) => (
      <div class="flex flex-col items-center gap-2">
        <Shape name="blob" tone={TONES[i]!} texture={texture} class="w-full max-w-24" />
        <p class="text-xs text-muted">
          {TONES[i]} · {texture}
        </p>
      </div>
    ))}
  </div>
  <div class="mt-10 grid items-center gap-8 md:grid-cols-[2fr_1fr]">
    <Collage variant="hero" />
    <Collage variant="compact" class="max-w-56" />
  </div>
  <div class="mt-10 flex flex-wrap items-center gap-8 text-3xl">
    <Logo variant="a" wordmark title="Variant A" />
    <Logo variant="b" wordmark title="Variant B" />
    <Logo variant="c" wordmark title="Variant C" />
    <Logo variant="a" title="Mark A" />
    <Logo variant="b" title="Mark B" />
    <Logo variant="c" title="Mark C" />
  </div>
</SgSection>
```

- [ ] **Step 9: The page** `src/pages/styleguide.astro`:

```astro
---
/**
 * Developer styleguide for the "Paper & cut-outs" design system.
 * English-only sample copy: exempt from the i18n dictionary rule. Not linked, noindex, not in the sitemap.
 */
import BaseLayout from '@/layouts/BaseLayout.astro';
import ColorsSection from '@/components/styleguide/ColorsSection.astro';
import ControlsSection from '@/components/styleguide/ControlsSection.astro';
import PatternsSection from '@/components/styleguide/PatternsSection.astro';
import ShapesSection from '@/components/styleguide/ShapesSection.astro';
import TypeSection from '@/components/styleguide/TypeSection.astro';

const NAV = [
  ['colors', 'Color'],
  ['type', 'Typography'],
  ['controls', 'Controls'],
  ['patterns', 'Learning patterns'],
  ['shapes', 'Shapes & logo'],
] as const;
---

<BaseLayout title="Styleguide" noindex monolingual>
  <div class="container-page pt-14 pb-6">
    <p class="eyebrow">Design system</p>
    <h1 class="mt-2 text-4xl font-bold tracking-tight md:text-5xl">Paper &amp; cut-outs</h1>
    <p class="mt-4 max-w-2xl text-lg text-muted">
      Calm academic precision with one hand-made layer from the channel intro.
    </p>
    <nav aria-label="Styleguide sections" class="mt-8 flex flex-wrap gap-x-5 gap-y-2">
      {NAV.map(([id, label]) => (
        <a href={`#${id}`} class="link">
          {label}
        </a>
      ))}
    </nav>
  </div>
  <div class="container-page">
    <ColorsSection />
    <TypeSection />
    <ControlsSection />
    <PatternsSection />
    <ShapesSection />
  </div>
</BaseLayout>
```

- [ ] **Step 10: Verify**

Run: `npm test && npm run check && npm run build && npm run check:styleguide` → all pass, "styleguide check passed".
Then `npx astro dev --background`, open `http://localhost:4321/styleguide` in light and dark: every contrast row shows ✓; the light panel stays light when the page is dark and vice versa; textures differ per shape (no leaking patterns); Tab shows the teal ring on links, buttons, input, quiz options.

- [ ] **Step 11: Commit**

```bash
git add src scripts astro.config.mjs package.json
git commit -m "Add /styleguide page for the Paper & cut-outs design system"
```

---

### Task 7: Apply to site pages and document

**Files:**

- Modify: `src/views/HomeView.astro`, `src/views/NotFoundView.astro`, `src/views/PlaceholderView.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `CLAUDE.md`

**Interfaces:**

- Consumes: `Collage`, `Shape`, `SectionHeading`, classes `.nav-link`, `.eyebrow`, `.card`, `.card-interactive`, `.card-shape`, `.link`.

- [ ] **Step 1: Home hero and features** — in `src/views/HomeView.astro`:

Imports add:

```ts
import SectionHeading from '@/components/SectionHeading.astro';
import Collage from '@/components/shapes/Collage.astro';
import Shape, { type ShapeName, type ShapeTone } from '@/components/shapes/Shape.astro';
```

Extend features: `const FEATURES: { title: UIKey; body: UIKey; shape: ShapeName; tone: ShapeTone }[]` with shapes `arch/teal`, `grid/brand`, `blob/teal`, `zigzag/brand` in order courses, grammar, practice, materials.

Replace the hero section with:

```astro
<section class="container-page grid items-center gap-10 pt-14 pb-12 md:grid-cols-[1.15fr_1fr] md:pt-20 md:pb-16">
  <div>
    <p class="eyebrow mb-4">{t('home.eyebrow')}</p>
    <h1 class="text-4xl leading-tight font-bold tracking-tight md:text-6xl">{t('home.title')}</h1>
    <p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">{t('home.lead')}</p>
    <div class="mt-10 flex flex-wrap gap-3">
      <a href={localizePath(lang, 'learn')} class="btn btn-primary">
        {t('home.ctaStart')}
      </a>
      <a href={localizePath(lang, 'classes')} class="btn btn-ghost">
        {t('home.ctaClasses')}
      </a>
    </div>
  </div>
  <Collage variant="hero" class="mx-auto max-w-md md:max-w-none" />
</section>
```

Replace the features heading with `<SectionHeading id="features-title">{t('home.featuresTitle')}</SectionHeading>` and each `<li>` with:

```astro
<li class="card card-interactive bg-surface">
  <Shape
    name={f.shape}
    tone={f.tone}
    texture="hatch"
    class="card-shape absolute -top-4 -right-4 w-20 opacity-90"
  />
  <h3 class="relative text-lg font-semibold">{t(f.title)}</h3>
  <p class="relative mt-2 max-w-[34ch] text-muted">{t(f.body)}</p>
  <p class="badge relative mt-4">{t('placeholder.comingSoon')}</p>
</li>
```

- [ ] **Step 2: 404 and placeholder** — in `NotFoundView.astro` wrap the section content in a two-column grid with `<Collage variant="compact" class="mx-auto max-w-56 md:max-w-xs" />` on the right; replace the `404` paragraph class with `eyebrow`. In `PlaceholderView.astro` replace the coming-soon paragraph class with `eyebrow`.

NotFoundView section:

```astro
<section class="container-page grid items-center gap-10 py-20 md:grid-cols-[1.4fr_1fr] md:py-28">
  <div>
    <p class="eyebrow mb-4">404</p>
    <h1 class="text-4xl font-bold tracking-tight md:text-5xl">{t('notFound.title')}</h1>
    <p class="mt-6 max-w-xl text-lg text-muted">{t('notFound.body')}</p>
    <a href={localizePath(lang)} class="btn btn-primary mt-10">
      {t('placeholder.backHome')}
    </a>
  </div>
  <Collage variant="compact" class="mx-auto max-w-56 md:max-w-xs" />
</section>
```

Add `import Collage from '@/components/shapes/Collage.astro';`.

- [ ] **Step 3: Header and footer details** — in `Header.astro` desktop nav link class becomes `class="nav-link"` (keep `aria-current`); mobile links keep their classes but replace `aria-[current=page]:text-brand` with `aria-[current=page]:text-teal`. In `Footer.astro` link class: replace `hover:bg-bg hover:text-text` with `hover:text-text` and add the class `nav-link` instead of the inline min-h/rounded/px utilities: `class="nav-link text-sm"`.

- [ ] **Step 4: CLAUDE.md** — in "Design tokens", replace the coral rule line (`At most one warm accent ...`) with:

```markdown
- No warm accent: the system is fully cool. **Teal** (scale from #56A8A3, from the channel
  intro) is the second color, used for learning moments (key-expression marks, "correct",
  progress, focus ring). Muted red only for errors / "wrong".
- Design system "Paper & cut-outs": see `docs/superpowers/specs/2026-10-11-design-system-design.md`
  and `/styleguide` (dev reference page, noindex). Signature details: hatch link underline,
  key-expression hatch mark, 원고지 grid paper for examples, cut-paper shapes (collage only in
  hero / 404 / empty states). Tokens: `src/styles/theme.css`; classes: `src/styles/signature.css`.
- `npm test` checks every semantic text/background pair for WCAG AA in both themes.
```

and in the neutrals line replace the old hex values with: `Light: bg #FBFBFD, paper #EEF0F8, border #DEE2EF, ink #1D2340, muted #4A5170. Dark (indigo): bg #111733, surface #1A2246, border #2C3763, text #E8EDFB, muted #A3ADCF.`
Also in "Decisions from Phase 1 setup", add `- Tests: Vitest (`npm test`).`

- [ ] **Step 5: Verify**

Run: `npm run format && npm test && npm run check && npm run build && npm run check:styleguide` → all clean.
Visual: home, `/ko/`, a placeholder, 404 and `/styleguide` in light and dark at desktop and 375px: no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`), long Korean pair wraps, collage does not overlap text, nav current link shows hatch.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Apply Paper & cut-outs to home, 404, header and footer; document design rules"
```
