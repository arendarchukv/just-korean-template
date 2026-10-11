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

const sitemap = readFileSync(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf8');
if (sitemap.includes('/styleguide')) problems.push('listed in sitemap');

if (problems.length) {
  console.error(`styleguide check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('styleguide check passed');
