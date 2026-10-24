import { describe, expect, it } from 'vitest';
import {
  deckSchema,
  download,
  lessonSchema,
  materialSchema,
  noticeSchema,
  pageAddress,
  quizSchema,
  siteSchema,
} from './schemas';

describe('pageAddress (the file name, so the page address, of a lesson, deck or quiz)', () => {
  it('takes small Latin letters, digits and single dashes', () => {
    for (const ok of ['winter-snacks', 'ge-vs-dorok', 'crash-course-08-numbers']) {
      expect(pageAddress.safeParse(ok).success, ok).toBe(true);
    }
  });
  it('refuses what would break the file name or the address', () => {
    for (const bad of ['', 'Winter snacks', '곰과-호랑이', 'test.md', '-a', 'a--b', 'a-']) {
      expect(pageAddress.safeParse(bad).success, bad).toBe(false);
    }
  });
  it('is part of lessons, decks and quizzes', () => {
    expect(lessonSchema.shape.address).toBeDefined();
    expect(deckSchema.shape.address).toBeDefined();
    expect(quizSchema.shape.address).toBeDefined();
  });
});

describe('lessonSchema', () => {
  const base = { title: 'Korean Grammar : 게 vs 도록', date: '2026-09-23', level: 'intermediate' };

  it('normalises a YouTube link to its id', () => {
    const r = lessonSchema.parse({ ...base, youtube: 'https://youtu.be/R3Ny_hDzKpc?si=x' });
    expect(r.youtube).toBe('R3Ny_hDzKpc');
  });

  it('rejects a link that is not a YouTube video', () => {
    const r = lessonSchema.safeParse({ ...base, youtube: 'https://www.youtube.com/@JustKorean' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('YouTube');
  });

  it('allows a lesson without a video and defaults its parts to empty', () => {
    const r = lessonSchema.parse(base);
    expect(r.youtube).toBeUndefined();
    expect(r).toMatchObject({ grammar: [], words: [], quiz: [], files: [] });
  });

  it('takes a playlist only from the list in code', () => {
    expect(lessonSchema.parse({ ...base, playlist: 'grammar' }).playlist).toBe('grammar');
    expect(lessonSchema.safeParse({ ...base, playlist: 'deleted' }).success).toBe(false);
  });

  it('carries its own words, quiz and files in the same shape as separate entries', () => {
    const r = lessonSchema.parse({
      ...base,
      grammar: ['-게', '-도록'],
      words: [{ front: '안 가요', back: "I don't go" }],
      quiz: [{ type: 'fill', sentence: '늦지 않___ 가요.', answer: '게' }],
      files: [{ label: 'Notes', kind: 'pdf', url: 'https://f.example/n.pdf' }],
    });
    expect(r.grammar).toEqual(['-게', '-도록']);
    expect(deckSchema.shape.cards.parse(r.words)).toEqual(r.words);
    expect(quizSchema.shape.questions.parse(r.quiz)).toEqual(r.quiz);
  });

  it('may carry a cover image and a reading text in parts, each with an optional translation', () => {
    const r = lessonSchema.parse({
      ...base,
      cover: '../../assets/lessons/bear.png',
      story: [
        {
          title: '사람이 되고 싶은 동물들',
          text: '옛날에 곰이 살았어요.',
          translation: 'Long ago…',
        },
        { title: '환웅의 시험', text: '환웅은 쑥과 마늘을 주었어요.' },
      ],
    });
    expect(r.cover).toBe('../../assets/lessons/bear.png');
    expect(r.story[1]!.translation).toBeUndefined();
    expect(lessonSchema.parse(base).story).toEqual([]);
  });

  it('rejects a reading part without Korean text', () => {
    expect(lessonSchema.safeParse({ ...base, story: [{ title: '1', text: '' }] }).success).toBe(
      false,
    );
  });

  it('rejects a broken question inside a lesson, as in a separate quiz', () => {
    const r = lessonSchema.safeParse({
      ...base,
      quiz: [{ type: 'fill', sentence: 'no gap here', answer: '게' }],
    });
    expect(r.success).toBe(false);
  });
});

describe('materialSchema', () => {
  const m = {
    title: '한국의 가족',
    date: '2026-06-19',
    files: [{ label: 'Worksheet', kind: 'pdf', url: 'https://f.example/w.pdf' }],
  };
  it('needs a section (tab) and a type, as on her old site', () => {
    expect(materialSchema.safeParse({ ...m, section: 'class', type: 'vocabulary' }).success).toBe(
      true,
    );
    expect(materialSchema.safeParse({ ...m, type: 'vocabulary' }).success).toBe(false);
    expect(materialSchema.safeParse({ ...m, section: 'class', type: 'poem' }).success).toBe(false);
  });
});

describe('download', () => {
  it('requires https', () => {
    expect(
      download.safeParse({ label: 'Notes', kind: 'pdf', url: 'http://x.example/a.pdf' }).success,
    ).toBe(false);
    expect(
      download.safeParse({ label: 'Notes', kind: 'pdf', url: 'https://x.example/a.pdf' }).success,
    ).toBe(true);
  });
});

describe('siteSchema', () => {
  it('shows no holiday unless one is chosen', () => {
    expect(siteSchema.parse({}).holiday).toBe('none');
    expect(siteSchema.parse({ holiday: 'auto' }).holiday).toBe('auto');
    expect(siteSchema.parse({ holiday: 'chuseok' }).holiday).toBe('chuseok');
    expect(siteSchema.safeParse({ holiday: 'halloween' }).success).toBe(false);
  });

  it('accepts a file without social links (Pages CMS drops an all-empty object)', () => {
    const r = siteSchema.parse({ tidycal: '' });
    expect(r.social).toEqual({ youtube: '', instagram: '', kofi: '' });
  });
});

describe('noticeSchema', () => {
  const notice = { title: 'New site', text: 'Welcome', from: '2026-10-14', to: '2026-11-14' };

  it('has three tones and is not pinned unless set', () => {
    const r = noticeSchema.parse({ ...notice, tone: 'news' });
    expect(r.tone).toBe('news');
    expect(r.pinned).toBe(false);
    expect(noticeSchema.parse({ ...notice, tone: 'info', pinned: true }).pinned).toBe(true);
  });

  it('needs no end date: missing, empty or null all mean "until deleted"', () => {
    for (const to of [undefined, '', null]) {
      const r = noticeSchema.parse({ ...notice, to, tone: 'info' });
      expect(r.to).toBeUndefined();
    }
  });

  it('rejects an end date before the start', () => {
    const r = noticeSchema.safeParse({
      title: 'Break',
      text: 'No classes',
      from: '2026-12-19',
      to: '2026-12-01',
      tone: 'important',
    });
    expect(r.success).toBe(false);
  });
});

describe('notice link', () => {
  const notice = { title: 'T', text: 'x', from: '2026-10-01', to: '2026-10-02', tone: 'info' };
  it('accepts a site path or a full https link', () => {
    expect(noticeSchema.safeParse({ ...notice, link: '/classes/' }).success).toBe(true);
    expect(noticeSchema.safeParse({ ...notice, link: 'https://tidycal.com/x' }).success).toBe(true);
  });
  it('rejects a bare domain, which would become a broken internal link', () => {
    expect(noticeSchema.safeParse({ ...notice, link: 'www.example.com' }).success).toBe(false);
  });
});
