/**
 * Korean news previews from an RSS feed (OhmyNews). Only what the feed publishes for syndication
 * is used: title, link, category, date and a short text excerpt; images and full text are not.
 */

export type NewsItem = {
  title: string;
  link: string;
  category: string;
  date: Date;
  excerpt: string;
};

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(\w+);/g, (m, name) => ENTITIES[name] ?? m);
}

/** Text of a tag, without CDATA; entities decoded. */
function field(item: string, tag: string): string {
  const raw = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(item)?.[1] ?? '';
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(raw);
  return cdata ? cdata[1].trim() : decode(raw.trim());
}

/** Plain text from the description HTML: no tags, no image, no "read more" link. */
function plainText(html: string): string {
  return decode(
    html
      .replace(/<a\b[\s\S]*?<\/a>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whole sentences up to `limit` characters; one long sentence is cut at a word with "…". */
export function excerpt(text: string, limit = 180): string {
  const sentences = text.split(/(?<=[.!?。])\s+/);
  let out = '';
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > limit) break;
    out = next;
  }
  if (out) return out;
  const cut = text.slice(0, limit);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).trim()}…`;
}

export function parseRss(xml: string, limit = 180): NewsItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, item]) => ({
      title: decode(field(item, 'title')),
      link: field(item, 'link'),
      category: field(item, 'category'),
      date: new Date(field(item, 'pubDate')),
      excerpt: excerpt(plainText(field(item, 'description')), limit),
    }))
    .filter((n) => n.title && n.link.startsWith('https://') && !Number.isNaN(n.date.getTime()));
}
