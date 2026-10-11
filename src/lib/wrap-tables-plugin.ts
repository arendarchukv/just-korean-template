import { defineHastPlugin } from 'satteri';

/**
 * Sätteri hast plugin (Astro's default Markdown processor): wraps every <table> in
 * <div class="table-scroll" tabindex="0">, so wide tables scroll inside themselves on small
 * screens instead of scrolling the page. The wrapper is focusable so keyboard users can scroll it.
 */
export const wrapTablesPlugin = defineHastPlugin({
  name: 'wrap-tables',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      const parent = ctx.parent(node);
      const cls = parent && 'properties' in parent ? parent.properties?.className : undefined;
      if (Array.isArray(cls) && cls.includes('table-scroll')) return;
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0 },
        children: [],
      });
    },
  },
});
