// Checks the built site in dist/ (run after `npm run build:test`, or `npm run build`, which leaves
// out the styleguide and its checks).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
// Classes data is hardcoded (not CMS); Node runs the TS module directly.
import { CLASSES } from '../src/data/classes.ts';
import { LANGS, defaultLang } from '../src/i18n/locales.ts';
import { NEW_LESSONS_COUNT } from '../src/data/teacher.ts';

const read = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../dist/${path}`, import.meta.url));
const problems = [];
/** Hardcoded content is translated: a page is checked against the text of its own language. */
/** Every language: its folder in dist/ ('' for English) and URL prefix ('' or '/ko'). */
const LOCALE_DIRS = LANGS.map((lang) =>
  lang === defaultLang
    ? { lang, dir: '', prefix: '' }
    : { lang, dir: `${lang}/`, prefix: `/${lang}` },
);
const langOf = (page) =>
  LANGS.find((l) => l !== defaultLang && page.startsWith(`${l}/`)) ?? defaultLang;
const prefixOf = (page) => LOCALE_DIRS.find((d) => d.lang === langOf(page)).prefix;
/** The same page in every language, e.g. inAll('classes/index.html'). */
const inAll = (path) => LOCALE_DIRS.map(({ dir }) => `${dir}${path}`);

if (exists('styleguide/index.html')) {
  // --- Styleguide (only in the test build, `npm run build:test`): English-only, unindexed, not in
  // the sitemap; its design-system samples: clean shapes, accessible samples ---
  const html = read('styleguide/index.html');
  if (/hreflang=/.test(html)) problems.push('styleguide emits hreflang links');
  if (!/name="robots" content="noindex"/.test(html)) problems.push('styleguide missing noindex');
  if (read('sitemap-0.xml').includes('/styleguide/')) problems.push('styleguide listed in sitemap');

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
} else {
  console.log('check:dist: no styleguide in this build (production); its checks skipped.');
}

// --- Interactive cards must be links (hover feedback promises a click) ---
for (const page of [
  ...inAll('index.html'),
  ...inAll('practice/index.html'),
  ...(exists('styleguide/index.html') ? ['styleguide/index.html'] : []),
]) {
  for (const [, tag] of read(page).matchAll(/<(\w+)[^>]*class="[^"]*\bcard-interactive\b/g)) {
    if (tag !== 'a') problems.push(`${page}: card-interactive on <${tag}>, not a link`);
  }
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
for (const page of inAll('index.html')) {
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

// --- Home page. Expectations come from the content files, so the check stays valid when JiEun
// edits content (no notices, fewer lessons, other links) and does not depend on today's date. ---
const contentDir = (dir) => new URL(`../src/content/${dir}/`, import.meta.url);
const contentFiles = (dir) =>
  existsSync(contentDir(dir)) ? readdirSync(contentDir(dir)).filter((f) => !f.startsWith('.')) : [];
const settings = (name) =>
  parse(readFileSync(new URL(`${name}.yml`, contentDir('settings')), 'utf8'));
const site = settings('site');
const noticeCount = contentFiles('notices').length;
/** Lessons with their front matter (the YAML between the first two --- lines). */
const lessonEntries = contentFiles('lessons').map((f) => {
  const text = readFileSync(new URL(f, contentDir('lessons')), 'utf8');
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
  return { id: f.replace(/\.md$/, ''), data: parse(front) ?? {} };
});
const yamlEntries = (dir) =>
  contentFiles(dir).map((f) => ({
    id: f.replace(/\.ya?ml$/, ''),
    data: parse(readFileSync(new URL(f, contentDir(dir)), 'utf8')),
  }));
// Every deck and quiz page: the separate entries, then lessons that carry their own.
const allDecks = [
  ...yamlEntries('decks').map((e) => ({
    id: e.id,
    fronts: e.data.cards.map((c) => String(c.front)),
  })),
  ...lessonEntries
    .filter((l) => (l.data.words ?? []).length > 0)
    .map((l) => ({ id: l.id, fronts: l.data.words.map((w) => String(w.front)) })),
];
const allQuizzes = [
  ...yamlEntries('quizzes').map((e) => ({ id: e.id, count: e.data.questions.length })),
  ...lessonEntries
    .filter((l) => (l.data.quiz ?? []).length > 0)
    .map((l) => ({ id: l.id, count: l.data.quiz.length })),
];
const videoLessons = contentFiles('lessons').filter((f) =>
  /^youtube:\s*\S/m.test(readFileSync(new URL(f, contentDir('lessons')), 'utf8')),
).length;
const expectedNewLessons = Math.min(NEW_LESSONS_COUNT, videoLessons);

const LOCALES = LOCALE_DIRS.map(({ dir, prefix }) => [`${dir}index.html`, prefix]);
const homeBlock = (page, name) =>
  new RegExp(`<section[^>]*data-home-block="${name}"[\\s\\S]*?</section>`).exec(read(page))?.[0] ??
  '';

for (const [page, prefix] of LOCALES) {
  const html = read(page);

  // Footer: links from site settings; empty ones are left out, never a dead "#" link.
  const footer = /<footer[\s\S]*<\/footer>/.exec(html)?.[0] ?? '';
  if (site.social?.youtube && !footer.includes(`href="${site.social.youtube}"`)) {
    problems.push(`${page}: footer YouTube link does not come from site settings`);
  }
  if (/href="#"/.test(footer)) problems.push(`${page}: footer has an empty "#" link`);
  // Contact: the contact page, which shows the Tally form (or the demo form until it is set).
  const contactHref = `${prefix}/contact/`;
  if (!footer.includes(`href="${contactHref}"`)) {
    problems.push(`${page}: footer Contact does not lead to ${contactHref}`);
  }

  // Notices: every notice is rendered with its dates; the browser hides the ones out of range.
  const notices = [...html.matchAll(/<li[^>]*data-notice="([^"]+)"[^>]*>/g)];
  if (notices.length !== noticeCount) {
    problems.push(`${page}: ${notices.length} notices rendered, ${noticeCount} in content`);
  }
  for (const [tag, id] of notices) {
    if (!/data-from="\d{4}-\d{2}-\d{2}"/.test(tag) || !/data-to="\d{4}-\d{2}-\d{2}"/.test(tag)) {
      problems.push(`${page}: notice ${id} lacks data-from/data-to`);
    }
  }

  // Blocks in order; notices and new lessons only when content has them.
  const found = [...html.matchAll(/data-home-block="([\w-]+)"/g)].map((m) => m[1]);
  const expected = [
    noticeCount > 0 && 'notices',
    'about',
    expectedNewLessons > 0 && 'new-lessons',
    'classes',
  ].filter(Boolean);
  if (found.join() !== expected.join()) {
    problems.push(`${page}: home blocks are [${found}], expected [${expected}]`);
  }

  // About: one h1 with the Korean serif title. Booking buttons never lead nowhere: TidyCal when
  // set, otherwise the Classes page.
  const h1s = [...html.matchAll(/<h1[\s\S]*?<\/h1>/g)].map((m) => m[0]);
  if (h1s.length !== 1) problems.push(`${page}: ${h1s.length} h1 elements`);
  if (!/lang="ko"[^>]*class="[^"]*font-display/.test(h1s[0] ?? '')) {
    problems.push(`${page}: h1 lacks the Korean display title`);
  }
  const bookHref = site.tidycal || `${prefix}/classes/`;
  const bookButtons = [...html.matchAll(/<a[^>]*data-book-class[^>]*>/g)].map((m) => m[0]);
  if (bookButtons.length === 0) problems.push(`${page}: no Book a class button`);
  for (const button of bookButtons) {
    if (!button.includes(`href="${bookHref}"`)) {
      problems.push(`${page}: Book a class does not lead to ${bookHref}`);
    }
  }

  // Credentials under the greeting: degree, certificate, channel.
  const facts = /class="hero-facts"[\s\S]*?<\/ul>/.exec(homeBlock(page, 'about'))?.[0] ?? '';
  const factCount = (facts.match(/<li[\s>]/g) ?? []).length;
  if (factCount !== 3)
    problems.push(`${page}: ${factCount} credentials on the home page, expected 3`);

  // Classes: a short line per format from src/data/classes.ts, no table, booking via TidyCal.
  const classes = homeBlock(page, 'classes');
  if (/<table/.test(classes)) problems.push(`${page}: home classes block is still a table`);
  for (const format of CLASSES[langOf(page)].formats) {
    if (!classes.includes(format.name))
      problems.push(`${page}: classes block lacks ${format.name}`);
  }
  if (!/data-book-class/.test(classes))
    problems.push(`${page}: classes block has no booking button`);

  if (/data-home-block="contents"/.test(html)) problems.push(`${page}: still has "On this site"`);

  // New lessons: local optimised thumbnails, links to existing lesson pages, video lessons only.
  const block = homeBlock(page, 'new-lessons');
  const imgs = [...block.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  if (imgs.length !== expectedNewLessons) {
    problems.push(`${page}: ${imgs.length} new-lesson thumbnails, expected ${expectedNewLessons}`);
  }
  for (const img of imgs) {
    if (/i\.ytimg\.com/.test(img)) problems.push(`${page}: thumbnail loads from YouTube`);
    if (!/width="\d+"/.test(img) || !/height="\d+"/.test(img)) {
      problems.push(`${page}: thumbnail without size`);
    }
  }
  const lessonLinks = [...block.matchAll(/<a[^>]*href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((h) => h.startsWith(`${prefix}/lessons/`) && h !== `${prefix}/lessons/`);
  if (lessonLinks.length !== expectedNewLessons) {
    problems.push(`${page}: ${lessonLinks.length} lesson links, expected ${expectedNewLessons}`);
  }
  for (const href of lessonLinks) {
    if (!exists(`${href.replace(/^\//, '')}index.html`)) {
      problems.push(`${page}: new lesson links to missing ${href}`);
    }
  }
}
// --- Navigation: four sections (grammar is reached from lessons), no /learn/ ---
for (const [page, prefix] of LOCALES) {
  const html = read(page);
  const nav = /<nav[^>]*aria-label="[^"]*"[^>]*>[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
  for (const path of ['lessons', 'materials', 'practice', 'classes']) {
    if (!nav.includes(`href="${prefix}/${path}/"`)) problems.push(`${page}: nav lacks ${path}`);
  }
  if (/<header[\s\S]*href="[^"]*\/grammar\/"[\s\S]*<\/header>/.test(html)) {
    problems.push(`${page}: grammar is still in the header menu`);
  }
  // Booking lives on the page (home, Classes), not in the header.
  if (/data-book-class/.test(/<header[\s\S]*?<\/header>/.exec(html)?.[0] ?? '')) {
    problems.push(`${page}: header still has a Book a class button`);
  }
  // Ko-fi: when its link is set, the header offers it (icon on desktop, link in the phone menu).
  if (site.social?.kofi) {
    const header = /<header[\s\S]*?<\/header>/.exec(html)?.[0] ?? '';
    const kofi = [...header.matchAll(/<a[^>]*data-kofi[^>]*>/g)].map((m) => m[0]);
    if (kofi.length !== 2 || kofi.some((a) => !a.includes(`href="${site.social.kofi}"`))) {
      problems.push(`${page}: header does not offer Ko-fi`);
    }
    if (kofi.some((a) => !/target="_blank"/.test(a) || !/rel="noopener noreferrer"/.test(a))) {
      problems.push(`${page}: Ko-fi does not open safely in a new tab`);
    }
  }
  if (/\/learn\//.test(html)) problems.push(`${page}: still links to /learn/`);
}
for (const path of ['lessons', 'grammar', 'practice']) {
  for (const prefix of LOCALE_DIRS.map((d) => d.dir)) {
    if (!exists(`${prefix}${path}/index.html`))
      problems.push(`missing ${prefix}${path}/index.html`);
  }
}

// --- Practice: the outside study tools come first, in every language ---
for (const page of inAll('practice/index.html')) {
  const html = read(page);
  // Study tools: dictionary, pronunciation and Korean news, straight to those sites in a new tab.
  const tools = /<ul[^>]*data-study-tools[\s\S]*?<\/ul>/.exec(html)?.[0] ?? '';
  if (!(html.indexOf('data-study-tools') < html.indexOf('practice-entries'))) {
    problems.push(`${page}: study tools do not come first`);
  }
  const quick = [...tools.matchAll(/<a[^>]*>/g)].map((m) => m[0]);
  const hosts = quick.map((a) => /href="https:\/\/([^/"]+)/.exec(a)?.[1]);
  if (hosts.join() !== 'krdict.korean.go.kr,nuri.iksi.or.kr,www.ohmynews.com') {
    problems.push(`${page}: quick links lead to [${hosts}]`);
  }
  if (quick.some((a) => !/target="_blank"/.test(a) || !/rel="noopener noreferrer"/.test(a))) {
    problems.push(`${page}: a quick link does not open safely in a new tab`);
  }
  // The dictionary card searches krdict right away (word field, new tab).
  if (
    !/<form[^>]*action="https:\/\/krdict\.korean\.go\.kr\/eng\/dicMarinerSearch\/search"[^>]*target="_blank"/.test(
      tools,
    )
  ) {
    problems.push(`${page}: dictionary card has no krdict search`);
  }
  if (!/name="mainSearchWord"/.test(tools)) problems.push(`${page}: dictionary field name`);
}

// --- Lessons library: every lesson linked and a course to choose, in every language ---
for (const [page, prefix] of LOCALE_DIRS.map(({ dir, prefix }) => [
  `${dir}lessons/index.html`,
  prefix,
])) {
  const html = read(page);
  for (const file of contentFiles('lessons')) {
    const id = file.replace(/\.md$/, '');
    if (!html.includes(`href="${prefix}/lessons/${id}/"`))
      problems.push(`${page}: no link to ${id}`);
  }
  if (!/<input[^>]*data-course/.test(html)) problems.push(`${page}: no course to choose`);
}

/** Internal links inside <main> that do not lead to a built page. */
const deadLinks = (html) => {
  const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
  return [...main.matchAll(/href="(\/[^"#]*)"/g)]
    .map((m) => m[1])
    .filter((href) => {
      const path = href.replace(/^\//, '');
      return !exists(`${path}index.html`) && !exists(path) && !exists(`${path}/index.html`);
    });
};

// --- Lesson page: player only after a click, real content, links resolve ---
{
  const html = read('lessons/ge-vs-dorok/index.html');
  if (/<iframe/.test(html)) problems.push('lesson page loads a YouTube iframe before a click');
  if (!/data-video-facade/.test(html)) problems.push('lesson page has no video facade');
  if (!/href="\/grammar\/#g-[^"]+"/.test(html)) {
    problems.push('lesson page does not link its grammar tags');
  }
  if (!/class="(?:[^"]* )?prose[ "]/.test(html))
    problems.push('lesson body is not rendered in .prose');
  for (const href of deadLinks(html)) problems.push(`lesson page links to missing ${href}`);
  for (const { id } of lessonEntries.filter(({ data }) => !data.youtube)) {
    if (/data-video-facade/.test(read(`lessons/${id}/index.html`))) {
      problems.push(`lesson without video (${id}) shows a player`);
    }
  }
}

// --- Grammar: built from the tags on lessons; each tag links the lessons that explain it ---
for (const [prefix, dir] of LOCALE_DIRS.map(({ dir, prefix }) => [prefix, dir])) {
  const index = read(`${dir}grammar/index.html`);
  for (const { id, data } of lessonEntries) {
    for (const tag of data.grammar ?? []) {
      if (!index.includes(String(tag).trim())) problems.push(`${dir}grammar: no tag ${tag}`);
      if (!index.includes(`href="${prefix}/lessons/${id}/"`)) {
        problems.push(`${dir}grammar: tag ${tag} does not link ${id}`);
      }
    }
  }
  if (exists(`${dir}grammar/ge/index.html`)) problems.push(`${dir}grammar/ge/ still exists`);
}
// A lesson's grammar links land on an anchor that exists.
{
  const index = read('grammar/index.html');
  const links = read('lessons/ge-vs-dorok/index.html').matchAll(/href="\/grammar\/#([^"]+)"/g);
  for (const [, anchor] of links) {
    if (!index.includes(`id="${anchor}"`)) problems.push(`grammar link #${anchor} has no target`);
  }
}

// --- Materials: a tab per non-empty section (lesson files last), every material listed ---
{
  const materials = yamlEntries('materials');
  const expected = ['class', 'podcast', 'self-study']
    .filter((section) => materials.some((m) => m.data.section === section))
    .map((section) => `mat-${section}`);
  if (lessonEntries.some((l) => (l.data.files ?? []).length > 0)) expected.push('mat-from-lessons');
  for (const page of inAll('materials/index.html')) {
    const html = read(page);
    const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map(
      (m) => /aria-controls="([\w-]+)"/.exec(m[0])?.[1],
    );
    const panels = [...html.matchAll(/<section[^>]*id="([\w-]+)"[^>]*data-mat-panel/g)].map(
      (m) => m[1],
    );
    if (panels.join() !== expected.join()) {
      problems.push(`${page}: panels [${panels}], expected [${expected}]`);
    }
    if (tabs.join() !== panels.join()) problems.push(`${page}: tabs [${tabs}] vs [${panels}]`);
    for (const { data } of materials) {
      if (!html.includes(data.title)) problems.push(`${page}: material "${data.title}" missing`);
    }
    for (const [, url] of html.matchAll(/class="mat-file"[^>]*href="([^"]+)"/g)) {
      if (!url.startsWith('https://')) problems.push(`${page}: file link ${url} is not https`);
    }
    if (!/<table class="mat-table">[\s\S]*?<th scope="col"/.test(html)) {
      problems.push(`${page}: materials are not a table with column headers`);
    }
    for (const href of deadLinks(html)) problems.push(`${page} links to missing ${href}`);
  }
}

// --- Classes page: formats with their facts, steps to start, FAQ, a closing call to act ---
for (const page of inAll('classes/index.html')) {
  const html = read(page);
  const { formats: FORMATS, steps: STEPS, faq: FAQ } = CLASSES[langOf(page)];
  const formats = [...html.matchAll(/<article[^>]*class="format"[\s\S]*?<\/article>/g)].map(
    (m) => m[0],
  );
  if (formats.length !== FORMATS.length) {
    problems.push(`${page}: ${formats.length} formats, expected ${FORMATS.length}`);
  }
  FORMATS.forEach((format, i) => {
    const block = formats[i] ?? '';
    if (!block.includes(format.name))
      problems.push(`${page}: format ${i + 1} is not ${format.name}`);
    if ((block.match(/<dt/g) ?? []).length !== format.facts.length) {
      problems.push(`${page}: ${format.name} facts are not a definition list`);
    }
    // Each card has its own way on: book a private class (TidyCal), ask about a group (contact).
    const contact = `${prefixOf(page)}/contact/`;
    const target = format.action === 'book' ? site.tidycal || contact : contact;
    if (!block.includes(`href="${target}"`)) {
      problems.push(`${page}: ${format.name} has no button to ${target}`);
    }
  });
  const steps = /<ol[^>]*class="steps"[\s\S]*?<\/ol>/.exec(html)?.[0] ?? '';
  if ((steps.match(/<li/g) ?? []).length !== STEPS.length) problems.push(`${page}: steps to start`);
  for (const item of FAQ) {
    if (!html.includes(item.question)) problems.push(`${page}: FAQ lacks "${item.question}"`);
  }
  if ((html.match(/<details class="faq-item"/g) ?? []).length !== FAQ.length) {
    problems.push(`${page}: FAQ count differs from src/data/classes.ts`);
  }
  if (!/data-classes-cta/.test(html)) problems.push(`${page}: no closing block to book or ask`);
  for (const href of deadLinks(html)) problems.push(`${page} links to missing ${href}`);
}

// --- Practice: the two studios, and the TOPIK mock test announced as coming soon ---
for (const page of inAll('practice/index.html')) {
  const html = read(page);
  // Two ways in: the Flashcards and Quizzes pages (each lists every deck or quiz beside the widget).
  const prefix = prefixOf(page);
  for (const kind of ['flashcards', 'quizzes']) {
    if (!html.includes(`href="${prefix}/practice/${kind}/"`)) {
      problems.push(`${page}: no link to ${prefix}/practice/${kind}/`);
    }
  }
  if (!/data-coming-soon/.test(html)) problems.push(`${page}: no "coming soon" TOPIK block`);
  for (const href of deadLinks(html)) problems.push(`${page} links to missing ${href}`);
}

// --- Contact: her Tally form inside the page; until it is set, a demo that sends nothing ---
const tallyId = /^https:\/\/tally\.so\/(?:r|embed)\/(\w+)/.exec(site.contactForm ?? '')?.[1];
for (const page of inAll('contact/index.html')) {
  if (!exists(page)) {
    problems.push(`missing ${page}`);
    continue;
  }
  if (tallyId) {
    const frame = /<iframe[^>]*data-tally-src[^>]*>/.exec(read(page))?.[0] ?? '';
    if (!frame.includes(`data-tally-src="https://tally.so/embed/${tallyId}?`))
      problems.push(`${page}: no frame with the Tally form ${tallyId}`);
    if (!/title="[^"]+"/.test(frame)) problems.push(`${page}: the Tally frame has no title`);
    if (!read(page).includes('tally.so/widgets/embed.js'))
      problems.push(`${page}: no Tally embed script to fit the frame`);
    if (/<form/.test(read(page))) problems.push(`${page}: demo form shown beside the Tally form`);
    continue;
  }
  const form = /<form[\s\S]*?<\/form>/.exec(read(page))?.[0] ?? '';
  for (const name of ['name', 'email', 'topic', 'message']) {
    const id = new RegExp(`name="${name}"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*name="${name}"`).exec(
      form,
    );
    const fieldId = id?.[1] ?? id?.[2];
    if (!fieldId) problems.push(`${page}: no field "${name}"`);
    else if (!form.includes(`for="${fieldId}"`))
      problems.push(`${page}: field "${name}" has no label`);
  }
  if (/action="/.test(form)) problems.push(`${page}: demo form has an action (it would send)`);
  if (!/data-demo-form/.test(form)) problems.push(`${page}: form is not marked as a demo`);
}

// --- News page removed: the home quick link goes straight to OhmyNews ---
for (const page of inAll('news/index.html')) {
  if (exists(page)) problems.push(`${page} still exists`);
}

// --- Deck pages: the widget, and every card readable without JavaScript ---
for (const dir of LOCALE_DIRS.map((d) => d.dir)) {
  for (const deck of allDecks) {
    const page = `${dir}practice/deck/${deck.id}/index.html`;
    if (!exists(page)) {
      problems.push(`missing ${page}`);
      continue;
    }
    const html = read(page);
    if (!/<astro-island[^>]*Flashcards/.test(html)) problems.push(`${page}: no flashcards widget`);
    const fallback = /<noscript>[\s\S]*?<\/noscript>/.exec(html)?.[0] ?? '';
    for (const front of deck.fronts) {
      if (!fallback.includes(front)) problems.push(`${page}: card "${front}" missing without JS`);
    }
  }
}

// --- Quiz pages: the widget, and every question readable without JavaScript ---
for (const dir of LOCALE_DIRS.map((d) => d.dir)) {
  for (const quiz of allQuizzes) {
    const page = `${dir}practice/quiz/${quiz.id}/index.html`;
    if (!exists(page)) {
      problems.push(`missing ${page}`);
      continue;
    }
    const html = read(page);
    if (!/<astro-island[^>]*Quiz/.test(html)) problems.push(`${page}: no quiz widget`);
    const fallback = /<noscript>[\s\S]*?<\/noscript>/.exec(html)?.[0] ?? '';
    if ((fallback.match(/<li/g) ?? []).length < quiz.count) {
      problems.push(`${page}: questions missing without JS`);
    }
  }
}

// --- Flashcards and Quizzes pages: a widget beside a list of every deck / quiz ---
for (const [dir, prefix] of LOCALE_DIRS.map(({ dir, prefix }) => [dir, prefix])) {
  for (const [kind, units, unit, widget] of [
    ['flashcards', allDecks, 'deck', 'Flashcards'],
    ['quizzes', allQuizzes, 'quiz', 'Quiz'],
  ]) {
    const index = `${dir}practice/${kind}/index.html`;
    if (!exists(index)) {
      problems.push(`missing ${index}`);
      continue;
    }
    const html = read(index);
    if (!new RegExp(`<astro-island[^>]*${widget}`).test(html)) problems.push(`${index}: no widget`);
    // The list is on the index and on every unit page, with the open one marked.
    for (const page of [
      index,
      ...units.map(({ id }) => `${dir}practice/${unit}/${id}/index.html`),
    ]) {
      const nav = /<nav[^>]*class="studio-nav"[\s\S]*?<\/nav>/.exec(read(page))?.[0] ?? '';
      for (const { id } of units) {
        if (!nav.includes(`href="${prefix}/practice/${unit}/${id}/"`)) {
          problems.push(`${page}: list lacks ${unit} ${id}`);
        }
      }
      if ((nav.match(/aria-current="page"/g) ?? []).length !== 1) {
        problems.push(`${page}: the open ${unit} is not marked once in the list`);
      }
    }
  }
}
for (const [prefix, dir] of LOCALE_DIRS.map(({ dir, prefix }) => [prefix, dir])) {
  const deckLesson = read(`${dir}lessons/crash-course-04-negation/index.html`);
  if (!deckLesson.includes(`href="${prefix}/practice/deck/crash-course-04-negation/"`)) {
    problems.push(`${dir}lesson page does not link its deck page`);
  }
  const quizLesson = read(`${dir}lessons/ge-vs-dorok/index.html`);
  if (!quizLesson.includes(`href="${prefix}/practice/quiz/ge-vs-dorok/"`)) {
    problems.push(`${dir}lesson page does not link its quiz page`);
  }
}

// --- JavaScript files load only where a widget lives, and Tally's script only on Contact ---
{
  const widgetPage = (p) => /(^|\/)practice\/(deck|quiz|flashcards|quizzes)\//.test(p);
  const contactPage = (p) => /(^|\/)contact\/index\.html$/.test(p);
  for (const page of htmlPages()) {
    const html = read(page);
    // Tally's embed code adds its script from an inline loader, not a <script src>.
    if (html.includes('tally.so/widgets/embed.js') && !contactPage(page)) {
      problems.push(`${page}: loads Tally's script outside Contact`);
    }
    const hasJsFile = /<astro-island|<script[^>]*\ssrc=/.test(html);
    if (hasJsFile && !widgetPage(page)) problems.push(`${page}: loads a JS file but has no widget`);
  }
}

// --- No duplicate ids on any built page ---
/** Every built HTML page (skips /_astro assets). A declaration, so checks above can use it. */
function htmlPages(dir = '') {
  return readdirSync(new URL(`../dist/${dir}`, import.meta.url), { withFileTypes: true }).flatMap(
    (e) =>
      e.isDirectory()
        ? e.name.startsWith('_')
          ? []
          : htmlPages(`${dir}${e.name}/`)
        : e.name.endsWith('.html')
          ? [`${dir}${e.name}`]
          : [],
  );
}
for (const page of htmlPages()) {
  const pageIds = [...read(page).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const twice = [...new Set(pageIds.filter((id, i) => pageIds.indexOf(id) !== i))];
  if (twice.length) problems.push(`${page}: duplicate ids ${twice.join(', ')}`);
}

// --- Lesson player thumbnail is sharp: at least 640px wide (sddefault), not an upscaled 480px ---
{
  const img = /<div class="video-facade"[\s\S]*?<img[^>]*>/.exec(
    read('lessons/ge-vs-dorok/index.html'),
  )?.[0];
  const width = Number(/width="(\d+)"/.exec(img ?? '')?.[1] ?? 0);
  if (width < 640) problems.push(`lesson player thumbnail is ${width}px wide`);
  if (!/sddefault/.test(img ?? '')) problems.push('lesson player does not use the 640px thumbnail');
}

// --- Holidays: Site settings none → nothing; auto → the date script, no holiday at build;
// a holiday chosen by hand → written on <html> at build ---
{
  const choice = site.holiday ?? 'none';
  for (const page of inAll('index.html')) {
    const doc = read(page);
    const attr = /<html[^>]*\sdata-holiday="([^"]+)"/.exec(doc)?.[1];
    const script = /const windows = \[\["seollal"/.test(doc);
    if (choice === 'none' && (attr || script)) problems.push(`${page}: holiday markup with none`);
    if (choice === 'auto' && (attr || !script))
      problems.push(`${page}: auto needs the script only`);
    if (!['none', 'auto'].includes(choice) && (attr !== choice || script)) {
      problems.push(`${page}: a chosen holiday needs data-holiday="${choice}" and no script`);
    }
    // Every holiday's greeting is in the home page unless the setting is none.
    const greetings = [...doc.matchAll(/data-holiday-piece="([a-z]+)"[^>]*data-holiday-greeting/g)];
    const want = choice === 'none' ? 0 : 5;
    if (greetings.length !== want) {
      problems.push(`${page}: ${greetings.length} holiday greetings, expected ${want}`);
    }
  }
  // Pieces are hidden unless <html> names their holiday.
  const css = readdirSync(new URL('../dist/_astro/', import.meta.url))
    .filter((f) => f.endsWith('.css'))
    .map((f) => read(`_astro/${f}`))
    .join('');
  if (!/\[data-holiday-piece\]\{display:none\}/.test(css)) {
    problems.push('holiday pieces are not hidden by default');
  }
}

// --- SEO: the sitemap lists only pages that are their own canonical and indexable; a lesson in
// another language points to the English one; a 404's language menu leads to existing pages ---
{
  const sitemap = read('sitemap-0.xml');
  for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = new URL(loc).pathname;
    const doc = read(`${path.slice(1)}index.html`);
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(doc)?.[1];
    if (canonical !== loc) problems.push(`sitemap lists ${path}, whose canonical is ${canonical}`);
    if (/name="robots" content="noindex"/.test(doc)) problems.push(`sitemap lists noindex ${path}`);
  }
  const copy = read('ko/lessons/ge-vs-dorok/index.html');
  if (
    !/<link rel="canonical" href="[^"]+\/lessons\/ge-vs-dorok\/"/.test(copy) ||
    /hreflang=/.test(/<head>[\s\S]*<\/head>/.exec(copy)?.[0] ?? '')
  ) {
    problems.push('a lesson in another language is not canonical to the English one');
  }
  if (/href="\/([a-z]{2}\/)?404\//.test(read('404.html'))) {
    problems.push('the 404 language menu links to a missing /404/ page');
  }
}

if (problems.length) {
  console.error(`dist check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('dist check passed');
