import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/**
 * A lesson, deck or quiz is named after its Page address (`.pages.yml`), and the site uses the file
 * name. Entries made before the field existed got it filled in from their file name.
 */
const FOLDERS = { lessons: '.md', decks: '.yml', quizzes: '.yml' } as const;

function data(folder: string, file: string): Record<string, unknown> {
  const text = readFileSync(`src/content/${folder}/${file}`, 'utf8');
  const yaml = file.endsWith('.md') ? (text.split(/^---$/m)[1] ?? '') : text;
  return (parse(yaml) ?? {}) as Record<string, unknown>;
}

describe('page addresses', () => {
  for (const [folder, ext] of Object.entries(FOLDERS)) {
    it(`every entry in ${folder} has the address of its file name`, () => {
      const files = readdirSync(`src/content/${folder}`).filter((f) => f.endsWith(ext));
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        expect(data(folder, file).address, file).toBe(file.slice(0, -ext.length));
      }
    });
  }
});
