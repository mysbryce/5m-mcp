'use client';

import { useTheme } from 'next-themes';
import { Github, Moon, Sun } from 'lucide-react';
import * as React from 'react';

export function DocsHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-1 border-b border-fd-border bg-fd-background/80 px-4 backdrop-blur">
      <a
        href="https://github.com/mysbryce/5m-mcp"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition hover:bg-fd-accent hover:text-fd-foreground"
      >
        <Github className="size-4" />
      </a>
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition hover:bg-fd-accent hover:text-fd-foreground"
      >
        {mounted ? (
          isDark ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )
        ) : (
          <span className="size-4" />
        )}
      </button>
    </header>
  );
}
