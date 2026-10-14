// Checks the built site in dist/ (run after `npm run build`).
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../dist/${path}`, import.meta.url));
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

// Long-form sample: Markdown renders inside .prose, and tables get the scroll wrapper.
if (!/class="prose"/.test(html)) problems.push('styleguide has no .prose long-form sample');
if (!/<div class="table-scroll" tabindex="0"><table>/.test(html)) {
  problems.push('Markdown tables are not wrapped in a focusable .table-scroll');
}

// Long-form headings carry an anchor to their own id.
const anchored = [
  ...html.matchAll(
    /<h[23] id="([^"]+)"[^>]*>(?:(?!<\/h[23]>)[\s\S])*?<a class="heading-anchor" href="#([^"]+)"/g,
  ),
];
if (anchored.length === 0) problems.push('long-form headings have no anchor links');
for (const [, id, href] of anchored) {
  if (id !== href) problems.push(`heading #${id} anchors to #${href}`);
}

if (read('sitemap-0.xml').includes('/styleguide')) problems.push('styleguide listed in sitemap');

// --- Interactive cards must be links (hover feedback promises a click) ---
for (const page of ['index.html', 'ko/index.html', 'styleguide/index.html']) {
  for (const [, tag] of read(page).matchAll(/<(\w+)[^>]*class="[^"]*\bcard-interactive\b/g)) {
    if (tag !== 'a') problems.push(`${page}: card-interactive on <${tag}>, not a link`);
  }
}

// Home feature cards are links with the hover effect, in both languages.
for (const [page, prefix] of [
  ['index.html', ''],
  ['ko/index.html', '/ko'],
]) {
  const cards = [...read(page).matchAll(/<a[^>]*class="[^"]*\bcard-interactive\b[^"]*"[^>]*>/g)];
  const hrefs = cards.map(([a]) => /href="([^"]+)"/.exec(a)?.[1]);
  if (cards.length !== 4)
    problems.push(`${page}: ${cards.length} linked feature cards, expected 4`);
  if (hrefs.some((h) => !h?.startsWith(`${prefix}/`))) {
    problems.push(`${page}: feature card links leave the ${prefix || 'en'} locale: ${hrefs}`);
  }
}

// --- About page exists in both languages, is in the sitemap and linked from the footer ---
for (const [page, href] of [
  ['index.html', '/about/'],
  ['ko/index.html', '/ko/about/'],
]) {
  const footer = /<footer[\s\S]*<\/footer>/.exec(read(page))?.[0] ?? '';
  if (!footer.includes(`href="${href}"`)) problems.push(`${page}: footer does not link to ${href}`);
}
for (const page of ['about/index.html', 'ko/about/index.html']) {
  if (!exists(page)) problems.push(`missing ${page}`);
}
if (!/<loc>https:\/\/[^<]+\/about\/<\/loc>/.test(read('sitemap-0.xml'))) {
  problems.push('about page is not in the sitemap');
}

// --- Theme toggle is a plain light/dark switch (no confusing "system" state) ---
const home = read('index.html');
if (/data-label-system|themePref|theme-icon-system/.test(home)) {
  problems.push('theme toggle still has a "system" state');
}
if (!/data-label-to-dark="[^"]+"/.test(home) || !/data-label-to-light="[^"]+"/.test(home)) {
  problems.push('theme toggle is missing its light/dark action labels');
}

// --- Current page is marked by the hatch in both desktop and mobile navigation ---
const currentLinks = [...read('classes/index.html').matchAll(/<a[^>]*aria-current="page"[^>]*>/g)];
const hatched = currentLinks.filter(([a]) => /class="[^"]*\bnav-link\b/.test(a));
if (hatched.length < 2) {
  problems.push(`current page has the nav-link hatch in ${hatched.length} of 2 menus`);
}

// --- Icons, manifest, share image, robots.txt ---
/** Width and height from a PNG header. */
const pngSize = (path) => {
  const buf = readFileSync(new URL(`../dist/${path}`, import.meta.url));
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
};
const expectPng = (path, w, h) => {
  if (!exists(path)) return problems.push(`missing ${path}`);
  const [pw, ph] = pngSize(path);
  if (pw !== w || ph !== h) problems.push(`${path} is ${pw}x${ph}, expected ${w}x${h}`);
};

expectPng('apple-touch-icon.png', 180, 180);
if (!/<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/.test(home)) {
  problems.push('apple-touch-icon link missing');
}

if (!/<link rel="manifest" href="\/site\.webmanifest"/.test(home)) {
  problems.push('manifest link missing');
}
if (exists('site.webmanifest')) {
  try {
    const manifest = JSON.parse(read('site.webmanifest'));
    if (!manifest.name || !manifest.icons?.length) problems.push('manifest lacks name or icons');
    for (const icon of manifest.icons ?? []) {
      const [w, h] = icon.sizes.split('x').map(Number);
      expectPng(icon.src.replace(/^\//, ''), w, h);
    }
    if (!manifest.icons?.some((i) => i.purpose === 'maskable')) {
      problems.push('manifest has no maskable icon');
    }
  } catch (error) {
    problems.push(`site.webmanifest is not valid JSON: ${error.message}`);
  }
} else {
  problems.push('missing site.webmanifest');
}

expectPng('og-default.png', 1200, 630);
for (const page of ['index.html', 'ko/index.html']) {
  const html = read(page);
  const og = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
  if (!og?.startsWith('https://')) problems.push(`${page}: og:image is not an absolute URL`);
  if (!/<meta property="og:image:alt" content="[^"]+"/.test(html)) {
    problems.push(`${page}: og:image:alt missing`);
  }
  if (!/<meta name="twitter:card" content="summary_large_image"/.test(html)) {
    problems.push(`${page}: twitter:card is not summary_large_image`);
  }
}

if (!exists('robots.txt')) problems.push('missing robots.txt');
else if (!/^Sitemap: https:\/\/\S+\/sitemap-index\.xml$/m.test(read('robots.txt'))) {
  problems.push('robots.txt has no absolute Sitemap line');
}

// --- Latin font is preloaded, so text does not render in a fallback and then shift ---
const preloads = [...read('index.html').matchAll(/<link rel="preload"[^>]*>/g)].map(([tag]) => tag);
if (!preloads.some((tag) => /as="font"/.test(tag) && /outfit-latin-wght-normal/.test(tag))) {
  problems.push('Outfit latin font is not preloaded');
}

// --- Footer links come from settings/site.yml: the YouTube link is set in demo content ---
for (const page of ['index.html', 'ko/index.html']) {
  const footer = /<footer[\s\S]*<\/footer>/.exec(read(page))?.[0] ?? '';
  if (!footer.includes('href="https://www.youtube.com/@JustKorean"')) {
    problems.push(`${page}: footer YouTube link does not come from site settings`);
  }
}

if (problems.length) {
  console.error(`dist check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('dist check passed');
