import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cmsForms } from './cms-forms';

const SAMPLE = `
components:
  level:
    type: select
    label: Level
    description: Who it is for.
    options:
      values:
        - { name: beginner, label: Beginner }
        - { name: advanced, label: 'Advanced (hard), e.g. natives' }
content:
  - name: lessons
    label: Lessons
    type: collection
    path: src/content/lessons
    fields:
      - name: title
        type: string
        required: true
        description: The title.
      - name: level
        component: level
        required: true
      - name: grammar
        type: reference
        options: { collection: grammar, multiple: true }
      - name: files
        type: object
        list: true
        fields:
          - { name: url, type: string, required: true }
  - name: grammar
    label: Grammar
    type: collection
    path: src/content/grammar
    fields:
      - { name: pattern, type: string }
  - name: quizzes
    type: collection
    path: src/content/quizzes
    fields:
      - name: questions
        type: block
        list: { min: 1 }
        blocks:
          - name: choice
            label: Multiple choice
            fields:
              - { name: prompt, type: string, required: true }
  - name: site
    label: Site settings
    type: file
    path: src/content/settings/site.yml
    fields:
      - { name: tidycal, type: string }
`;

describe('cmsForms', () => {
  const forms = cmsForms(SAMPLE);
  const lessons = forms[0]!;

  it('lists every form in CMS order with its kind and folder', () => {
    expect(forms.map((f) => [f.name, f.kind])).toEqual([
      ['lessons', 'collection'],
      ['grammar', 'collection'],
      ['quizzes', 'collection'],
      ['site', 'file'],
    ]);
    expect(lessons.path).toBe('src/content/lessons');
  });

  it('falls back to a capitalised name when a form or field has no label', () => {
    expect(forms[2]!.label).toBe('Quizzes');
    expect(lessons.fields[0]!.label).toBe('Title');
  });

  it('keeps the hint and whether a field is required', () => {
    expect(lessons.fields[0]).toMatchObject({
      type: 'Short text',
      required: true,
      hint: 'The title.',
    });
    expect(lessons.fields[2]!.required).toBe(false);
  });

  it('expands components and names the choices without their explanations', () => {
    expect(lessons.fields[1]).toMatchObject({
      label: 'Level',
      type: 'Choice',
      required: true,
      hint: 'Who it is for.',
      options: ['Beginner', 'Advanced'],
    });
  });

  it('names the form a reference points to, by its label', () => {
    expect(lessons.fields[2]!.type).toBe('Links to Grammar');
  });

  it('shows groups and blocks with their inner fields, and marks repeatable fields', () => {
    expect(lessons.fields[3]).toMatchObject({ type: 'Group', list: true });
    expect(lessons.fields[3]!.children.map((c) => c.name)).toEqual(['url']);
    const questions = forms[2]!.fields[0]!;
    expect(questions).toMatchObject({ type: 'Blocks', list: true });
    expect(questions.children[0]).toMatchObject({ label: 'Multiple choice', type: 'Variant' });
    expect(questions.children[0]!.children[0]!.name).toBe('prompt');
  });

  it('reads the real Pages CMS config', () => {
    const real = cmsForms(readFileSync('.pages.yml', 'utf8'));
    expect(real.map((f) => f.name)).toEqual([
      'lessons',
      'series',
      'grammar',
      'materials',
      'decks',
      'quizzes',
      'notices',
      'site',
    ]);
    const body = real[0]!.fields.find((f) => f.name === 'body');
    expect(body).toMatchObject({ label: 'Lesson text', type: 'Formatted text' });
    const series = real[0]!.fields.find((f) => f.name === 'series');
    expect(series?.type).toBe('Link to Series');
  });
});
