import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { headingAnchorsPlugin } from './heading-anchors-plugin';

function render(markdown: string): string {
  return markdownToHtml(markdown, { hastPlugins: [headingAnchorsPlugin] }).html.trim();
}

describe('headingAnchorsPlugin', () => {
  it('gives h2 an id and an anchor link named by the heading itself', () => {
    expect(render('## Hello world')).toBe(
      '<h2 id="hello-world">Hello world<a class="heading-anchor" href="#hello-world" aria-labelledby="hello-world"></a></h2>',
    );
  });

  it('adds anchors to h3 as well, but not to h4', () => {
    const html = render('### Build it\n\n#### Detail');
    expect(html).toContain('href="#build-it"');
    expect(html).toContain('<h4 id="detail">Detail</h4>');
  });

  it('keeps Hangul in slugs and de-duplicates repeated headings like Astro does', () => {
    const html = render('## 봤자\n\n## 봤자');
    expect(html).toContain('<h2 id="봤자">');
    expect(html).toContain('<h2 id="봤자-1">');
  });

  it('leaves pronunciation (<rt>) out of the id', () => {
    expect(render('## <ruby>봤자<rt>봗짜</rt></ruby>: the result')).toContain(
      '<h2 id="봤자-the-result">',
    );
  });

  it('puts no text inside the anchor (the # is drawn by CSS), so ids and outlines stay clean', () => {
    expect(render('## Title')).toMatch(/<a class="heading-anchor"[^>]*><\/a>/);
  });
});
