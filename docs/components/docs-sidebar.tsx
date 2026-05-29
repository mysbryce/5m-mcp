'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import type { PageTree } from 'fumadocs-core/server';

import {
  BookOpen,
  Plug2,
  Wrench,
  Boxes,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Guide: BookOpen,
  Clients: Plug2,
  Reference: Wrench,
  Plugins: Boxes,
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] ?? Sparkles;
  return <Icon className={className} />;
}

type NavNode = PageTree.Node;

export function DocsSidebar({ tree }: { tree: PageTree.Root }) {
  return (
    <aside className="fixed top-0 left-0 z-20 hidden h-screen w-[240px] flex-col border-r border-fd-border bg-fd-card/40 backdrop-blur lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-fd-border px-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full bg-[oklch(0.6049_0.1419_276.7)] shadow-[0_0_12px_oklch(0.6049_0.1419_276.7/0.8)]"
          />
          <span className="text-sm font-semibold tracking-tight">5m-mcp</span>
          <span className="ml-1 rounded bg-fd-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-fd-muted-foreground">
            v0.7.0
          </span>
        </Link>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-3">
          {tree.children.map((node) => (
            <NavGroup key={nodeKey(node)} node={node} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-fd-border px-4 py-3 text-[11px] text-fd-muted-foreground">
        <Link
          href="https://github.com/mysbryce/5m-mcp"
          target="_blank"
          rel="noreferrer"
          className="hover:text-fd-foreground"
        >
          github.com/mysbryce/5m-mcp
        </Link>
      </div>
    </aside>
  );
}

function nodeKey(node: NavNode, fallback = ''): string {
  if ('$id' in node && node.$id) return String(node.$id);
  if ('url' in node && node.url) return node.url;
  if ('name' in node && node.name) return String(node.name) + fallback;
  return Math.random().toString(36);
}

function NavGroup({ node }: { node: NavNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(true);

  if (node.type === 'separator') {
    return (
      <li className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fd-muted-foreground/70">
        {String(node.name)}
      </li>
    );
  }

  if (node.type === 'page') {
    const active = pathname === node.url;
    return (
      <li>
        <Link
          href={node.url}
          className={`flex items-center rounded-md px-2 py-1.5 text-[13px] transition-colors ${
            active
              ? 'bg-fd-accent text-fd-accent-foreground'
              : 'text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-foreground'
          }`}
        >
          {node.name}
        </Link>
      </li>
    );
  }

  // folder
  const name = String(node.name);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-fd-foreground hover:bg-fd-accent/50"
      >
        <CategoryIcon name={name} className="size-3.5 text-fd-muted-foreground" />
        <span className="flex-1 text-left">{name}</span>
        <ChevronDown
          className={`size-3.5 text-fd-muted-foreground transition-transform ${
            open ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>
      {open && (
        <ul className="mt-1 space-y-0.5 pl-3.5">
          {(node.children ?? []).map((child) => (
            <NavGroup key={nodeKey(child)} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
