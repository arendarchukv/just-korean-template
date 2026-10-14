// Checks that every file link in content (R2 downloads, her photo) answers. Run before deploy.
// Placeholder links on the .example domain are skipped.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/content/', import.meta.url));
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(md|ya?ml)$/.test(name)) files.push(path);
  }
};
walk(root);

const links = new Map();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const [, url] of text.matchAll(/(?:url|photo):\s*['"]?(https:\/\/[^\s'"]+)/g)) {
    if (new URL(url).hostname.endsWith('.example')) continue;
    links.set(url, file);
  }
}

const dead = [];
await Promise.all(
  [...links].map(async ([url, file]) => {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (!res.ok) dead.push(`${res.status} ${url} (${file})`);
    } catch (error) {
      dead.push(`${error.message} ${url} (${file})`);
    }
  }),
);

if (dead.length) {
  console.error(`dead file links:\n- ${dead.join('\n- ')}`);
  process.exit(1);
}
console.log(`file links ok (${links.size} checked)`);
