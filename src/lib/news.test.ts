import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { excerpt, parseRss } from './news';

const xml = readFileSync('src/lib/news.fixture.xml', 'utf8');

describe('parseRss', () => {
  const items = parseRss(xml);

  it('reads every item with title, link, category and date', () => {
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: "도서관에서 '한글 주간' 행사, 10일부터 열려",
      link: 'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0000000001',
      category: '문화',
    });
    expect(items[0].date.toISOString()).toBe('2026-10-14T00:30:00.000Z');
  });

  it('decodes entities in titles', () => {
    expect(items[1].title).toBe('버스 노선 & 시간표 바뀐다');
  });

  it('keeps only text in the excerpt: no image, no "read more" link', () => {
    expect(items[0].excerpt).not.toMatch(/<|전체 내용보기|ojsfile/);
    expect(items[0].excerpt.startsWith('시립 도서관이 한글날을 맞아')).toBe(true);
  });

  it('drops items without a title or an https link', () => {
    const broken = xml
      .replace('<title><![CDATA[버스 노선 &amp; 시간표 바뀐다]]></title>', '')
      .replace(
        'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0000000001</link>',
        'javascript:alert(1)</link>',
      );
    expect(parseRss(broken)).toHaveLength(0);
  });

  it('returns nothing for something that is not RSS', () => {
    expect(parseRss('<html>error</html>')).toEqual([]);
  });
});

describe('excerpt', () => {
  it('keeps whole sentences up to the limit', () => {
    const text = '첫 문장이다. 두 번째 문장이다. 세 번째 문장은 아주 길어서 잘려야 한다.';
    expect(excerpt(text, 20)).toBe('첫 문장이다. 두 번째 문장이다.');
  });

  it('cuts a single long sentence at a word and adds an ellipsis', () => {
    expect(excerpt('가나다 라마바 사아자 차카타 파하', 10)).toBe('가나다 라마바…');
  });
});
