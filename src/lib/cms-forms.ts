/**
 * The Pages CMS forms as plain data, read from `.pages.yml` at build time (DEMO: used only by the
 * Site info page, so it always shows the forms she really gets).
 */
import { parse } from 'yaml';

export interface CmsField {
  name: string;
  label: string;
  /** Human name of the input, e.g. "Short text", "Choice", "Links to Grammar". */
  type: string;
  required: boolean;
  /** Repeatable: she can add as many as she needs. */
  list: boolean;
  hint: string;
  /** Choice labels, without their explanations. */
  options: string[];
  /** Inner fields of a group, or the variants of a block list. */
  children: CmsField[];
}

export interface CmsForm {
  name: string;
  label: string;
  /** A collection holds many entries (one file each); a file form edits one file. */
  kind: 'collection' | 'file';
  path: string;
  fields: CmsField[];
}

interface RawField {
  name: string;
  label?: string;
  type?: string;
  component?: string;
  required?: boolean;
  description?: string;
  list?: unknown;
  options?: {
    collection?: string;
    multiple?: boolean;
    values?: { name: string; label?: string }[];
  };
  fields?: RawField[];
  blocks?: RawField[];
}
interface RawEntry {
  name: string;
  label?: string;
  type: 'collection' | 'file';
  path: string;
  fields: RawField[];
}

const TYPES: Record<string, string> = {
  string: 'Short text',
  text: 'Long text',
  'rich-text': 'Formatted text',
  number: 'Number',
  date: 'Date',
  boolean: 'Checkbox',
  select: 'Choice',
  object: 'Group',
  block: 'Blocks',
};

const capitalise = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
/** "Important (red), e.g. ..." -> "Important". */
const shortLabel = (label: string) => label.split(/ \(|,/)[0]!.trim();

export function cmsForms(yamlText: string): CmsForm[] {
  const config = parse(yamlText) as {
    components?: Record<string, Omit<RawField, 'name'>>;
    content: RawEntry[];
  };
  const labelOf = (name: string) => {
    const entry = config.content.find((e) => e.name === name);
    return entry?.label ?? capitalise(name);
  };

  const field = (raw: RawField, variant = false): CmsField => {
    // Field keys win over the component's, as in Pages CMS.
    const f: RawField = raw.component ? { ...config.components?.[raw.component], ...raw } : raw;
    let type = variant ? 'Variant' : (TYPES[f.type ?? ''] ?? capitalise(f.type ?? 'field'));
    if (f.type === 'reference') {
      const target = labelOf(f.options?.collection ?? '');
      type = f.options?.multiple ? `Links to ${target}` : `Link to ${target}`;
    }
    return {
      name: f.name,
      label: f.label ?? capitalise(f.name),
      type,
      required: f.required === true,
      list: Boolean(f.list),
      hint: f.description ?? '',
      options: (f.options?.values ?? []).map((v) => shortLabel(v.label ?? v.name)),
      children: f.blocks
        ? f.blocks.map((b) => field(b, true))
        : (f.fields ?? []).map((c) => field(c)),
    };
  };

  return config.content.map((entry) => ({
    name: entry.name,
    label: entry.label ?? capitalise(entry.name),
    kind: entry.type,
    path: entry.path,
    fields: entry.fields.map((f) => field(f)),
  }));
}
