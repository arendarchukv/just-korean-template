import { describe, expect, it } from 'vitest';
import { download, lessonSchema, noticeSchema, siteSchema } from './schemas';

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

  it('allows a lesson without a video and defaults lists', () => {
    const r = lessonSchema.parse(base);
    expect(r.youtube).toBeUndefined();
    expect(r.grammar).toEqual([]);
    expect(r.downloads).toEqual([]);
  });

  it('turns stored reference paths into ids', () => {
    const r = lessonSchema.parse({
      ...base,
      series: 'src/content/series/grammar.yml',
      grammar: ['ge.md', 'dorok'],
    });
    expect(r.series).toBe('grammar');
    expect(r.grammar).toEqual(['ge', 'dorok']);
  });

  it('needs a series for an episode number', () => {
    expect(lessonSchema.safeParse({ ...base, episode: 3 }).success).toBe(false);
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
