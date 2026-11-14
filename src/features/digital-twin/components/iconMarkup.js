import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArrowUpRight, ArrowRight, ArrowLeft, Circle } from 'lucide-react';

// Cache Lucide SVG for the legacy runtime's HTML-based panels.
const icons = { ArrowUpRight, ArrowRight, ArrowLeft, Circle };
const cache = new Map();

export function iconMarkup(name) {
  if (!cache.has(name)) {
    cache.set(
      name,
      renderToStaticMarkup(
        createElement(icons[name], {
          size: 14,
          strokeWidth: 1.75,
          'aria-hidden': true,
          className: 'runtime-icon',
        })
      )
    );
  }
  return cache.get(name);
}
