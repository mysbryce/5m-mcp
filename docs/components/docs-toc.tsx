'use client';

import * as React from 'react';
import type { TOCItemType } from 'fumadocs-core/server';

export function DocsTOC({ items }: { items: TOCItemType[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(String(item.url).replace('#', ''));
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="text-[13px]">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fd-muted-foreground/70">
        On this page
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const id = String(item.url).replace('#', '');
          const active = activeId === id;
          return (
            <li
              key={String(item.url)}
              style={{ paddingLeft: `${Math.max(0, item.depth - 2) * 12}px` }}
            >
              <a
                href={String(item.url)}
                className={`block py-0.5 transition-colors ${
                  active
                    ? 'text-[oklch(0.6049_0.1419_276.7)]'
                    : 'text-fd-muted-foreground hover:text-fd-foreground'
                }`}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
