import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { SCHEMAS } from './schemas';

type Field = {
  name: string;
  type?: string;
  component?: string;
  description?: string;
  fields?: Field[];
  blocks?: { name: string; fields?: Field[]; component?: string }[];
  blockKey?: string;
  pattern?: { regex: string; message?: string };
  options?: { min?: number; max?: number };
  list?: boolean | { min?: number };
};
type Entry = { name: string; type: string; path: string; fields: Field[] };

const config = parse(readFileSync('.pages.yml', 'utf8')) as {
  components?: Record<string, Omit<Field, 'name'>>;
  content: Entry[];
};

/** Field with its component expanded (field keys win, as in Pages CMS). */
function expand(field: Field): Field {
  if (!field.component) return field;
  const component = config.components?.[field.component];
  if (!component) throw new Error(`unknown component ${field.component}`);
  return { ...component, ...field } as Field;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- walking zod internals */

/** Strip optional/default/array/pipe wrappers down to the object or union inside. */
function core(schema: any): any {
  for (;;) {
    const def = schema._zod.def;
    if (['optional', 'nullable', 'default', 'prefault'].includes(def.type)) schema = def.innerType;
    else if (def.type === 'array') schema = def.element;
    else if (def.type === 'pipe') schema = def.in;
    else return schema;
  }
}

/** Whether a schema is a URL field (possibly optional, or a union with the empty string). */
function isUrl(schema: any): boolean {
  if (!schema) return false;
  const c = core(schema);
  if (c._zod.def.type === 'union') return c._zod.def.options.some(isUrl);
  return c._zod.def.format === 'url';
}

function compare(fields: Field[], schema: any, where: string) {
  const obj = core(schema);
  expect(obj._zod.def.type, `${where} is an object`).toBe('object');
  const shape = obj._zod.def.shape;
  const cms = fields.map(expand).filter((f) => f.name !== 'body');
  expect(cms.map((f) => f.name).sort(), `${where} fields`).toEqual(Object.keys(shape).sort());
  for (const f of cms) {
    // A link the schema requires to be https:// must be checked in the form too, so the editor
    // sees the error before saving instead of a failed build.
    if (isUrl(shape[f.name])) {
      expect(f.pattern?.regex, `${where}.${f.name} has an https pattern`).toBe('^https://');
    }
    if (f.fields) compare(f.fields, shape[f.name], `${where}.${f.name}`);
    if (f.blocks) {
      const key = f.blockKey ?? '_block';
      const union = core(shape[f.name]);
      for (const block of f.blocks) {
        const option = union._zod.def.options.find((o: any) =>
          o._zod.def.shape[key]._zod.def.values.includes(block.name),
        );
        expect(option, `${where}.${f.name} block ${block.name}`).toBeDefined();
        const blockFields = expand(block as Field).fields ?? [];
        compare([...blockFields, { name: key }], option, `${where}.${f.name}.${block.name}`);
      }
    }
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

describe('.pages.yml', () => {
  it('has a form for every collection and nothing else', () => {
    expect(config.content.map((e) => e.name).sort()).toEqual(Object.keys(SCHEMAS).sort());
  });

  for (const entry of config.content) {
    it(`${entry.name} form matches its schema`, () => {
      compare(entry.fields, SCHEMAS[entry.name as keyof typeof SCHEMAS], entry.name);
    });
  }

  it('the form enforces the limits the schema enforces', () => {
    const field = (path: string): Field => {
      // Walks field names; a block name steps into that block's fields.
      const [entry, ...names] = path.split('.');
      let fields = config.content.find((e) => e.name === entry)!.fields;
      let blocks: NonNullable<Field['blocks']> = [];
      let found: Field | undefined;
      for (const name of names) {
        const block = blocks.find((b) => b.name === name);
        if (block) {
          fields = block.fields ?? [];
          blocks = [];
          continue;
        }
        found = fields.map(expand).find((f) => f.name === name);
        fields = found?.fields ?? [];
        blocks = found?.blocks ?? [];
      }
      return found!;
    };
    expect(field('home.newLessonsCount').options).toMatchObject({ min: 1, max: 6 });
    expect(field('lessons.episode').options).toMatchObject({ min: 1 });
    expect(field('quizzes.questions').list).toMatchObject({ min: 1 });
    expect(field('quizzes.questions.fill.sentence').pattern?.regex).toBe('___');
    const youtube = new RegExp(field('lessons.youtube').pattern!.regex);
    expect(youtube.test('https://youtu.be/_lgDjyWiheU')).toBe(true);
    expect(youtube.test('_lgDjyWiheU')).toBe(true);
    expect(youtube.test('https://www.instagram.com/justkorean')).toBe(false);
  });

  it('every field has a hint for the editor', () => {
    const missing: string[] = [];
    const walk = (fields: Field[], where: string) => {
      for (const raw of fields) {
        const f = expand(raw);
        if (!f.description) missing.push(`${where}.${f.name}`);
        if (f.fields) walk(f.fields, `${where}.${f.name}`);
        for (const b of f.blocks ?? []) walk(expand(b as Field).fields ?? [], `${where}.${b.name}`);
      }
    };
    for (const e of config.content) walk(e.fields, e.name);
    expect(missing).toEqual([]);
  });

  it('collections point at the folders the site loads', () => {
    for (const e of config.content) {
      const expected = ['home', 'classes', 'site'].includes(e.name)
        ? `src/content/settings/${e.name}.yml`
        : `src/content/${e.name}`;
      expect(e.path, e.name).toBe(expected);
    }
  });
});
