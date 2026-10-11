import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { wrapTablesPlugin } from './wrap-tables-plugin';

async function render(markdown: string): Promise<string> {
  const { html } = await markdownToHtml(markdown, {
    features: { gfm: true },
    hastPlugins: [wrapTablesPlugin],
  });
  return html;
}

const TABLE = '| Pattern | Use |\n| --- | --- |\n| 봤자 | result |\n';

describe('wrapTablesPlugin', () => {
  it('wraps a Markdown table in a focusable horizontal-scroll container', async () => {
    const html = await render(TABLE);
    expect(html).toMatch(/<div class="table-scroll" tabindex="0"><table>/);
    expect(html).toMatch(/<\/table><\/div>/);
  });

  it('wraps every table once', async () => {
    const html = await render(`${TABLE}\nText between.\n\n${TABLE}`);
    expect(html.match(/class="table-scroll"/g)).toHaveLength(2);
    expect(html.match(/<table>/g)).toHaveLength(2);
  });

  it('leaves other content alone', async () => {
    const html = await render('Just a paragraph.\n\n- one\n- two\n');
    expect(html).not.toMatch(/table-scroll/);
  });
});
