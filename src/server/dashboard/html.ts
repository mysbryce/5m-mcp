import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The dashboard UI is authored as a Vite + Vue project under /dashboard and
// built to a single self-contained file at dist/dashboard/index.html.
// We read it at runtime so rebuilding the UI doesn't require rebuilding the
// resource bundle. Cached after first read.

let cached: string | null = null;

const FALLBACK = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>agent_api dashboard</title>
<style>body{font-family:system-ui;background:#16161a;color:#eee;display:grid;place-items:center;height:100vh;margin:0}div{max-width:520px;padding:32px;text-align:center;line-height:1.6}</style>
</head><body><div>
<h1>Dashboard not built</h1>
<p>The dashboard UI hasn't been built yet. From the resource folder run:</p>
<pre>cd dashboard &amp;&amp; npm install &amp;&amp; npm run build</pre>
<p>or <code>npm run dashboard:build</code> from the repo root, then restart the resource.</p>
</div></body></html>`;

export function dashboardHtml(): string {
  if (cached !== null) return cached;
  const p = join(GetResourcePath(GetCurrentResourceName()), 'dist', 'dashboard', 'index.html');
  cached = existsSync(p) ? readFileSync(p, 'utf8') : FALLBACK;
  return cached;
}
