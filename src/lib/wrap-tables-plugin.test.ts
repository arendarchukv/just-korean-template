import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { wrapTablesPlugin } from './wrap-tables-plugin';

function render(markdown: string): string {
  const { html } = markdownToHtml(markdown, {
    features: { gfm: true },
    hastPlugins: [wrapTablesPlugin],
  });
  return html;
}

const TABLE = '| Pattern | Use |\n| --- | --- |\n| 봤자 | result |\n';

describe('wrapTablesPlugin', () => {
  it('wraps a Markdown table in a focusable horizontal-scroll container', () => {
    const html = render(TABLE);
    expect(html).toMatch(/<div class="table-scroll" tabindex="0"><table>/);
    expect(html).toMatch(/<\/table><\/div>/);
  });

  it('wraps every table once', () => {
    const html = render(`${TABLE}\nText between.\n\n${TABLE}`);
    expect(html.match(/class="table-scroll"/g)).toHaveLength(2);
    expect(html.match(/<table>/g)).toHaveLength(2);
  });

  it('leaves other content alone', () => {
    const html = render('Just a paragraph.\n\n- one\n- two\n');
    expect(html).not.toMatch(/table-scroll/);
  });
});
