// Checks the built site in dist/ (run after `npm run build`).
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const problems = [];

// --- Styleguide: English-only, unindexed, clean shapes, accessible samples ---
const html = read('styleguide/index.html');

if (/hreflang=/.test(html)) problems.push('styleguide emits hreflang links');
if (/href="\/ko\/styleguide/.test(html)) problems.push('styleguide links to /ko/styleguide');
if (!/name="robots" content="noindex"/.test(html)) problems.push('styleguide missing noindex');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (dupes.length) problems.push(`duplicate ids: ${dupes.join(', ')}`);

// Shapes have clean edges: no pixel-displacement filters (they made contours and textures ragged).
if (/<feDisplacementMap|<feTurbulence/.test(html))
  problems.push('shapes use a displacement filter');

// Quiz options: only a selected option is "pressed"; revealed results need screen-reader text.
for (const [button] of html.matchAll(/<button[^>]*class="quiz-option"[\s\S]*?<\/button>/g)) {
  const state = /data-state="(\w+)"/.exec(button)?.[1];
  if (/aria-pressed="true"/.test(button) && state !== 'selected') {
    problems.push(`quiz option "${state}" is announced as pressed`);
  }
  if ((state === 'correct' || state === 'wrong') && !/class="sr-only"/.test(button)) {
    problems.push(`quiz option "${state}" has no screen-reader label`);
  }
}

if (!/class="btn btn-link"/.test(html)) problems.push('styleguide does not show the link button');

if (read('sitemap-0.xml').includes('/styleguide')) problems.push('styleguide listed in sitemap');

// --- Interactive cards must be links (hover feedback promises a click) ---
for (const page of ['index.html', 'ko/index.html', 'styleguide/index.html']) {
  for (const [, tag] of read(page).matchAll(/<(\w+)[^>]*class="[^"]*\bcard-interactive\b/g)) {
    if (tag !== 'a') problems.push(`${page}: card-interactive on <${tag}>, not a link`);
  }
}

// --- Current page is marked by the hatch in both desktop and mobile navigation ---
const currentLinks = [...read('classes/index.html').matchAll(/<a[^>]*aria-current="page"[^>]*>/g)];
const hatched = currentLinks.filter(([a]) => /class="[^"]*\bnav-link\b/.test(a));
if (hatched.length < 2) {
  problems.push(`current page has the nav-link hatch in ${hatched.length} of 2 menus`);
}

if (problems.length) {
  console.error(`dist check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('dist check passed');
