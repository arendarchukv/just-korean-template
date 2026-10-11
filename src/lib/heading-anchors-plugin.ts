import type { ElementContent } from 'hast';
import GithubSlugger from 'github-slugger';
import { defineHastPlugin } from 'satteri';

/**
 * Sätteri hast plugin: gives headings ids and appends an anchor link to h2/h3, so a section of
 * a lesson can be linked to. Ids use the same slugger as Astro's heading-ids plugin (which runs
 * later and keeps existing ids), so `headings` metadata stays consistent. The anchor has no text:
 * its "#" is drawn by CSS, and its accessible name comes from the heading (aria-labelledby).
 */
/**
 * Heading text for the slug, without pronunciation (<rt>, <rp>) inside <ruby>.
 * Inline HTML in Markdown arrives as a flat run of `raw` tags and text nodes, so track whether
 * we are between an opening and closing rt/rp tag; Markdown syntax arrives as real elements.
 */
function slugText(nodes: readonly (ElementContent | { type: 'raw'; value: string })[]): string {
  let skipDepth = 0;
  let text = '';
  for (const node of nodes) {
    if (node.type === 'raw') {
      if (/^<(rt|rp)\b/i.test(node.value)) skipDepth += 1;
      else if (/^<\/(rt|rp)>/i.test(node.value)) skipDepth = Math.max(0, skipDepth - 1);
    } else if (skipDepth > 0) {
      continue;
    } else if (node.type === 'text') {
      text += node.value;
    } else if (node.type === 'element' && node.tagName !== 'rt' && node.tagName !== 'rp') {
      text += slugText(node.children);
    }
  }
  return text;
}

export const headingAnchorsPlugin = () => {
  const slugger = new GithubSlugger();
  return defineHastPlugin({
    name: 'heading-anchors',
    element: {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      visit(node, ctx) {
        const existing = node.properties?.id;
        const id = typeof existing === 'string' ? existing : slugger.slug(slugText(node.children));
        if (typeof existing !== 'string') ctx.setProperty(node, 'id', id);
        if (node.tagName !== 'h2' && node.tagName !== 'h3') return;
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'a',
          properties: { className: ['heading-anchor'], href: `#${id}`, ariaLabelledBy: [id] },
          children: [],
        });
      },
    },
  });
};
