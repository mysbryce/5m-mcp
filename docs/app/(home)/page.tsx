import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Terminal,
  Wrench,
  Boxes,
  Camera,
} from 'lucide-react';

const features = [
  {
    icon: <Boxes className="size-5" />,
    title: 'One drop-in FiveM resource',
    body: 'No external sidecar. Drop the folder into resources/[agent]/, ensure agent_api, paste the printed MCP config into your client.',
  },
  {
    icon: <Wrench className="size-5" />,
    title: '36+ tools out of the box',
    body: 'Filesystem (sandboxed), resource lifecycle, console capture, live-player probes, dynamic client + server natives, allowlisted shell.',
  },
  {
    icon: <BookOpen className="size-5" />,
    title: 'Framework bridges',
    body: 'ESX, ox_lib, oxmysql plugins auto-detect on boot. Reflective dispatchers expose every method behind a readonly verb gate.',
  },
  {
    icon: <Terminal className="size-5" />,
    title: 'Speaks real MCP',
    body: 'HTTP transport for Claude Code, Cursor, and any spec-compliant client. Bundled stdio shim for clients that need stdin/stdout.',
  },
  {
    icon: <Camera className="size-5" />,
    title: 'Live UI screenshots',
    body: 'Attach to FiveM CEF over CDP, isolate one resource iframe, capture a clean PNG, hand it back to the agent for review.',
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: 'Built for safety on a live server',
    body: 'Token bootstrap, per-resource locks, readonly mode, blocklists for dangerous natives, ACE-aware, audit log of every action.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_-10%,oklch(0.6049_0.1419_276.7/0.18),transparent_70%)]"
        />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card/60 px-3 py-1 text-xs font-medium text-fd-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-[oklch(0.6049_0.1419_276.7)]" />
            v0.4.1 · Model Context Protocol for FiveM
          </span>
          <h1 className="text-gradient text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            Let any MCP agent <br className="hidden sm:block" /> build, run, and debug
            <br className="hidden sm:block" /> FiveM resources live.
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-base text-fd-muted-foreground sm:text-lg">
            A single FiveM resource that exposes a safe, sandboxed Model Context Protocol surface.
            Claude Code, Codex, Cursor — whatever you use, point it at one URL and ship code straight
            from chat.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/guide/quick-start"
              className="group inline-flex items-center gap-2 rounded-md bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Quick start
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/docs/clients/claude-code"
              className="inline-flex items-center gap-2 rounded-md border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium hover:bg-fd-accent"
            >
              Install in Claude Code
            </Link>
            <Link
              href="https://github.com/mysbryce/5m-mcp"
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-fd-muted-foreground hover:text-fd-foreground"
            >
              GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Quick install snippet */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="mb-4 text-xs uppercase tracking-widest text-fd-muted-foreground">
            Three lines, then you're done
          </p>
          <pre className="overflow-x-auto rounded-lg border border-fd-border bg-fd-card p-5 text-sm leading-relaxed">
            <code>
              {`# FiveM server console
refresh
ensure agent_api
# console prints a copy-paste-ready Claude/Cursor/Codex MCP config block`}
            </code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything the agent needs, nothing it doesn't.
            </h2>
            <p className="mt-3 text-fd-muted-foreground">
              Designed for one job: shipping FiveM code with an LLM at the keyboard. Every surface is
              tracked, gated, or sandboxed.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-lg border border-fd-border bg-fd-card/50 p-6 transition hover:border-fd-accent-foreground/30 hover:bg-fd-card"
              >
                <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-fd-accent text-fd-accent-foreground">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-fd-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-b">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Read the docs. Wire your agent. Ship.
          </h2>
          <p className="max-w-xl text-fd-muted-foreground">
            Pick your stack and follow the integration guide — every supported client has its own
            page with a copy-paste config block.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/docs/clients/claude-code"
              className="rounded-md border border-fd-border px-4 py-2 text-sm hover:bg-fd-accent"
            >
              Claude Code
            </Link>
            <Link
              href="/docs/clients/codex"
              className="rounded-md border border-fd-border px-4 py-2 text-sm hover:bg-fd-accent"
            >
              Codex CLI
            </Link>
            <Link
              href="/docs/clients/cursor"
              className="rounded-md border border-fd-border px-4 py-2 text-sm hover:bg-fd-accent"
            >
              Cursor
            </Link>
            <Link
              href="/docs/clients/others"
              className="rounded-md border border-fd-border px-4 py-2 text-sm hover:bg-fd-accent"
            >
              Cline / Continue / Zed
            </Link>
            <Link
              href="/docs/clients/custom"
              className="rounded-md border border-fd-border px-4 py-2 text-sm hover:bg-fd-accent"
            >
              Custom HTTP
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-fd-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p>
            Released under the{' '}
            <Link
              href="https://github.com/mysbryce/5m-mcp/blob/main/LICENSE"
              className="underline-offset-4 hover:underline"
            >
              PolyForm Noncommercial 1.0.0
            </Link>{' '}
            license.
          </p>
          <p>
            <Link
              href="https://github.com/mysbryce/5m-mcp"
              className="underline-offset-4 hover:underline"
            >
              github.com/mysbryce/5m-mcp
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
