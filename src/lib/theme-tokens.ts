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
