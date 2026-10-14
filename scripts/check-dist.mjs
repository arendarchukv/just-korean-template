// Checks the built site in dist/ (run after `npm run build`).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
// Classes data is hardcoded (not CMS); Node runs the TS module directly.
import { FAQ, FORMATS, STEPS } from '../src/data/classes.ts';
import { NEW_LESSONS_COUNT, TEACHER } from '../src/data/teacher.ts';

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

// --- About page exists in both languages, is in the sitemap and linked from the footer ---
for (const [page, href] of [
  ['index.html', '/about/'],
  ['ko/index.html', '/ko/about/'],
]) {
  const footer = /<footer[\s\S]*<\/footer>/.exec(read(page))?.[0] ?? '';
  if (!footer.includes(`href="${href}"`)) problems.push(`${page}: footer does not link to ${href}`);
}
// About content comes from src/data/teacher.ts: story, principles, timeline, channel numbers.
for (const page of ['about/index.html', 'ko/about/index.html']) {
  if (!exists(page)) {
    problems.push(`missing ${page}`);
    continue;
  }
  const html = read(page);
  if (/placeholder\.comingSoon|Coming soon|준비 중/.test(html))
    problems.push(`${page}: still a placeholder`);
  if (!html.includes(TEACHER.greeting.replace("'", '&#39;')) && !html.includes(TEACHER.greeting)) {
    problems.push(`${page}: no greeting`);
  }
  const timeline = /<ol[^>]*class="timeline"[\s\S]*?<\/ol>/.exec(html)?.[0] ?? '';
  if ((timeline.match(/<li/g) ?? []).length !== TEACHER.timeline.length) {
    problems.push(`${page}: timeline does not list ${TEACHER.timeline.length} places`);
  }
  const stats = /<dl[^>]*class="channel-stats"[\s\S]*?<\/dl>/.exec(html)?.[0] ?? '';
  if ((stats.match(/<dd/g) ?? []).length !== TEACHER.channel.length) {
    problems.push(`${page}: channel numbers missing`);
  }
  for (const p of TEACHER.principles) {
    if (!html.includes(p.title)) problems.push(`${page}: principle "${p.title}" missing`);
  }
  // Illustrated portrait: a local optimised image with a description, not the paper collage.
  const portrait = /<img[^>]*class="[^"]*about-portrait[^"]*"[^>]*>/.exec(html)?.[0] ?? '';
  if (!portrait) problems.push(`${page}: no portrait`);
  else {
    if (!/src="\/_astro\/[^"]+\.webp"/.test(portrait))
      problems.push(`${page}: portrait not optimised`);
    if (!/alt="[^"]+"/.test(portrait)) problems.push(`${page}: portrait has no alt text`);
    if (!/width="\d+"/.test(portrait) || !/height="\d+"/.test(portrait)) {
      problems.push(`${page}: portrait without size`);
    }
  }
  if (/class="collage/.test(/<section[^>]*about-page[\s\S]*?<\/section>/.exec(html)?.[0] ?? '')) {
    problems.push(`${page}: collage still shown instead of the portrait`);
  }
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

// --- Home page. Expectations come from the content files, so the check stays valid when JiEun
// edits content (no notices, fewer lessons, other links) and does not depend on today's date. ---
const contentDir = (dir) => new URL(`../src/content/${dir}/`, import.meta.url);
const contentFiles = (dir) =>
  existsSync(contentDir(dir)) ? readdirSync(contentDir(dir)).filter((f) => !f.startsWith('.')) : [];
const settings = (name) =>
  parse(readFileSync(new URL(`${name}.yml`, contentDir('settings')), 'utf8'));
const site = settings('site');
const noticeCount = contentFiles('notices').length;
const videoLessons = contentFiles('lessons').filter((f) =>
  /^youtube:\s*\S/m.test(readFileSync(new URL(f, contentDir('lessons')), 'utf8')),
).length;
const expectedNewLessons = Math.min(NEW_LESSONS_COUNT, videoLessons);

const LOCALES = [
  ['index.html', ''],
  ['ko/index.html', '/ko'],
];
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
  // Contact: the Tally form when set, otherwise the demo contact page.
  const contactHref = site.contactForm || `${prefix}/contact/`;
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
    'classes',
    'contents',
    expectedNewLessons > 0 && 'new-lessons',
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

  // Classes: a real table with headers, rows from src/data/classes.ts.
  const table = homeBlock(page, 'classes');
  if ((table.match(/<th scope="col"/g) ?? []).length < 3) {
    problems.push(`${page}: classes table lacks column headers`);
  }
  for (const format of FORMATS) {
    if (!table.includes(format.name)) problems.push(`${page}: classes table lacks ${format.name}`);
  }

  // 목차: five numbered sections, links stay in the locale.
  const links = [...homeBlock(page, 'contents').matchAll(/<a[^>]*href="([^"]+)"/g)].map(
    (m) => m[1],
  );
  if (links.length !== 5) problems.push(`${page}: site contents has ${links.length} links, not 5`);
  if (links.some((h) => !h.startsWith(`${prefix}/`))) {
    problems.push(`${page}: contents leave the locale`);
  }

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
// --- Navigation: five sections, no /learn/ ---
for (const [page, prefix] of LOCALES) {
  const html = read(page);
  const nav = /<nav[^>]*aria-label="[^"]*"[^>]*>[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
  for (const path of ['lessons', 'grammar', 'materials', 'practice', 'classes']) {
    if (!nav.includes(`href="${prefix}/${path}/"`)) problems.push(`${page}: nav lacks ${path}`);
  }
  if (/\/learn\//.test(html)) problems.push(`${page}: still links to /learn/`);
}
for (const path of ['lessons', 'grammar', 'practice']) {
  for (const prefix of ['', 'ko/']) {
    if (!exists(`${prefix}${path}/index.html`))
      problems.push(`missing ${prefix}${path}/index.html`);
  }
}

// --- Lessons library: every lesson linked, a course as a numbered list, in both languages ---
for (const [page, prefix] of [
  ['lessons/index.html', ''],
  ['ko/lessons/index.html', '/ko'],
]) {
  const html = read(page);
  for (const file of contentFiles('lessons')) {
    const id = file.replace(/\.md$/, '');
    if (!html.includes(`href="${prefix}/lessons/${id}/"`))
      problems.push(`${page}: no link to ${id}`);
  }
  if (!/<ol[^>]*class="[^"]*course-list/.test(html)) {
    problems.push(`${page}: course is not a numbered list`);
  }
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
  if (!/href="\/grammar\/ge\/"/.test(html)) problems.push('lesson page does not link its grammar');
  if (!/class="prose"/.test(html)) problems.push('lesson body is not rendered in .prose');
  for (const href of deadLinks(html)) problems.push(`lesson page links to missing ${href}`);
  if (/data-video-facade/.test(read('lessons/korean-numbers/index.html'))) {
    problems.push('lesson without video shows a player');
  }
}

// --- Grammar: index lists every pattern; each pattern page exists in both languages ---
for (const [prefix, dir] of [
  ['', ''],
  ['/ko', 'ko/'],
]) {
  const index = read(`${dir}grammar/index.html`);
  for (const file of contentFiles('grammar')) {
    const id = file.replace(/\.md$/, '');
    if (!index.includes(`href="${prefix}/grammar/${id}/"`)) {
      problems.push(`${dir}grammar: no link to ${id}`);
    }
    if (!exists(`${dir}grammar/${id}/index.html`)) problems.push(`missing ${dir}grammar/${id}/`);
  }
}
if (exists('grammar/ge/index.html')) {
  const ge = read('grammar/ge/index.html');
  if (!/href="\/lessons\/ge-vs-dorok\/"/.test(ge))
    problems.push('grammar/ge lacks its video lesson');
  for (const href of deadLinks(ge)) problems.push(`grammar/ge links to missing ${href}`);
}

// --- Materials: chips match sections, every file link is https, no empty section ---
for (const page of ['materials/index.html', 'ko/materials/index.html']) {
  const html = read(page);
  const chips = [
    ...html.matchAll(/<a[^>]*class="[^"]*section-chip[^"]*"[^>]*href="#([\w-]+)"/g),
  ].map((m) => m[1]);
  const sections = [...html.matchAll(/<section[^>]*id="([\w-]+)"[^>]*data-material-section/g)].map(
    (m) => m[1],
  );
  if (sections.length === 0) problems.push(`${page}: no material sections`);
  if (chips.join() !== sections.join()) problems.push(`${page}: chips [${chips}] vs [${sections}]`);
  for (const [, url] of html.matchAll(/class="file-link"[^>]*href="([^"]+)"/g)) {
    if (!url.startsWith('https://')) problems.push(`${page}: file link ${url} is not https`);
  }
  for (const href of deadLinks(html)) problems.push(`${page} links to missing ${href}`);
}

// --- Classes page: formats with their facts, steps to start, FAQ, a closing call to act ---
for (const page of ['classes/index.html', 'ko/classes/index.html']) {
  const html = read(page);
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

// --- Practice: decks and quizzes have anchors used by lesson pages; dictionary form targets krdict ---
for (const page of ['practice/index.html', 'ko/practice/index.html']) {
  const html = read(page);
  // Prefixed ids: a deck and a quiz may share a file name (both named after their lesson).
  for (const [dir, prefix] of [
    ['decks', 'deck'],
    ['quizzes', 'quiz'],
  ]) {
    for (const file of contentFiles(dir)) {
      const id = `${prefix}-${file.replace(/\.ya?ml$/, '')}`;
      if (!html.includes(`id="${id}"`)) problems.push(`${page}: no anchor ${id}`);
    }
  }
  if (
    !/<form[^>]*action="https:\/\/krdict\.korean\.go\.kr\/eng\/dicMarinerSearch\/search"/.test(html)
  ) {
    problems.push(`${page}: dictionary form does not target krdict`);
  }
  if (!/name="mainSearchWord"/.test(html)) problems.push(`${page}: dictionary field name`);
  for (const href of deadLinks(html)) problems.push(`${page} links to missing ${href}`);
}

// --- Contact (demo): labelled fields, nothing is sent anywhere ---
for (const page of ['contact/index.html', 'ko/contact/index.html']) {
  if (!exists(page)) {
    problems.push(`missing ${page}`);
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

// --- News: loaded in the browser from the OhmyNews RSS (builds are rare), never baked in ---
for (const page of ['news/index.html', 'ko/news/index.html']) {
  const html = read(page);
  if (!/data-news-feed[^>]*data-feed="https:\/\/rss\.ohmynews\.com\//.test(html)) {
    problems.push(`${page}: no client-side news feed container`);
  }
  if (/<li[^>]*class="news-item"/.test(html)) problems.push(`${page}: news baked in at build time`);
  if (!/<noscript>[\s\S]*?href="https:\/\/www\.ohmynews\.com\/"/.test(html)) {
    problems.push(`${page}: no fallback link to OhmyNews without JavaScript`);
  }
  if (!/OhmyNews/.test(html)) problems.push(`${page}: no source attribution`);
}

// --- Deck pages: the widget, and every card readable without JavaScript ---
for (const dir of ['', 'ko/']) {
  for (const file of contentFiles('decks')) {
    const id = file.replace(/\.ya?ml$/, '');
    const page = `${dir}practice/deck/${id}/index.html`;
    if (!exists(page)) {
      problems.push(`missing ${page}`);
      continue;
    }
    const html = read(page);
    if (!/<astro-island[^>]*Flashcards/.test(html)) problems.push(`${page}: no flashcards widget`);
    const fallback = /<noscript>[\s\S]*?<\/noscript>/.exec(html)?.[0] ?? '';
    // Parsed as YAML, so quoted values work too.
    const deckData = parse(readFileSync(new URL(file, contentDir('decks')), 'utf8'));
    const fronts = (deckData.cards ?? []).map((c) => String(c.front));
    for (const front of fronts) {
      if (!fallback.includes(front)) problems.push(`${page}: card "${front}" missing without JS`);
    }
  }
}

// --- Quiz pages: the widget, and every question readable without JavaScript ---
for (const dir of ['', 'ko/']) {
  for (const file of contentFiles('quizzes')) {
    const id = file.replace(/\.ya?ml$/, '');
    const page = `${dir}practice/quiz/${id}/index.html`;
    if (!exists(page)) {
      problems.push(`missing ${page}`);
      continue;
    }
    const html = read(page);
    if (!/<astro-island[^>]*Quiz/.test(html)) problems.push(`${page}: no quiz widget`);
    const fallback = /<noscript>[\s\S]*?<\/noscript>/.exec(html)?.[0] ?? '';
    const count = (
      readFileSync(new URL(file, contentDir('quizzes')), 'utf8').match(/- type:/g) ?? []
    ).length;
    if ((fallback.match(/<li/g) ?? []).length < count) {
      problems.push(`${page}: questions missing without JS`);
    }
  }
}

// --- Practice and lesson pages link to the widget pages ---
for (const [page, prefix] of [
  ['practice/index.html', ''],
  ['ko/practice/index.html', '/ko'],
]) {
  const html = read(page);
  for (const [dir, kind] of [
    ['decks', 'deck'],
    ['quizzes', 'quiz'],
  ]) {
    for (const file of contentFiles(dir)) {
      const href = `${prefix}/practice/${kind}/${file.replace(/\.ya?ml$/, '')}/`;
      if (!html.includes(`href="${href}"`)) problems.push(`${page}: no link to ${href}`);
    }
  }
  if (/coming soon|곧 직접/i.test(html)) problems.push(`${page}: still says "coming soon"`);
}
for (const [prefix, dir] of [
  ['', ''],
  ['/ko', 'ko/'],
]) {
  const deckLesson = read(`${dir}lessons/negative-form/index.html`);
  if (!deckLesson.includes(`href="${prefix}/practice/deck/negative-form/"`)) {
    problems.push(`${dir}lesson page does not link its deck page`);
  }
  const quizLesson = read(`${dir}lessons/ge-vs-dorok/index.html`);
  if (!quizLesson.includes(`href="${prefix}/practice/quiz/ge-vs-dorok/"`)) {
    problems.push(`${dir}lesson page does not link its quiz page`);
  }
}

// --- JavaScript files load only where a widget lives ---
{
  const widgetPage = (p) => /(^|\/)practice\/(deck|quiz)\//.test(p);
  for (const page of htmlPages()) {
    const html = read(page);
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

if (problems.length) {
  console.error(`dist check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('dist check passed');
