/**
 * NUI screenshot helper. Spawned by the screenshot_nui MCP tool.
 *
 * Argv:
 *   1. outputPath      — absolute PNG output path
 *   2. cdpUrl          — default http://localhost:13172
 *   3. timeoutMs       — default 15000
 *   4. targetFilter    — optional substring; first page URL containing it wins
 *
 * Strategy:
 *   Do NOT launch our own browser. Connect to FiveM's CEF over CDP at the
 *   same port that serves the DevTools index. List CEF pages, pick the first
 *   "nui://" / resource page (optionally filtered), and screenshot it in
 *   place — that captures the real NUI render, not the DevTools UI.
 *
 *   Emits one JSON line on stdout: { ok, path?, bytes?, target?, error? }.
 */

import { writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

type PlaywrightChromium = {
  connectOverCDP: (url: string) => Promise<PwBrowser>;
};

type PwPage = {
  url: () => string;
  title: () => Promise<string>;
  screenshot: (opts: { fullPage?: boolean; type?: 'png' | 'jpeg' }) => Promise<Buffer>;
};

type PwContext = { pages: () => PwPage[] };
type PwBrowser = { contexts: () => PwContext[]; close: () => Promise<void> };

async function loadChromium(): Promise<PlaywrightChromium> {
  try {
    const pw = (await import('playwright')) as { chromium: PlaywrightChromium };
    return pw.chromium;
  } catch {
    throw new Error(
      'playwright is not installed. Run `npm install playwright` in the agent_api folder.',
    );
  }
}

function report(payload: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(payload) + '\n');
}

function isLikelyNui(url: string): boolean {
  const u = url.toLowerCase();
  if (u.startsWith('devtools://')) return false;
  if (u.startsWith('chrome://')) return false;
  if (u === 'about:blank') return false;
  if (u.startsWith('nui://')) return true;
  if (u.startsWith('https://cfx-nui-')) return true;
  if (u.startsWith('http://cfx-nui-')) return true;
  return true;
}

async function main(): Promise<void> {
  const outputPath = process.argv[2];
  const cdpUrl = process.argv[3] ?? 'http://localhost:13172';
  const timeoutMs = Number(process.argv[4] ?? '15000');
  const targetFilter = (process.argv[5] ?? '').toLowerCase();

  if (!outputPath) {
    report({
      ok: false,
      error: 'usage: screenshot-nui <outputPath> [cdpUrl] [timeoutMs] [targetFilter]',
    });
    process.exit(2);
  }

  try {
    mkdirSync(dirname(outputPath), { recursive: true });
  } catch (e) {
    report({ ok: false, error: `mkdir failed: ${(e as Error).message}` });
    process.exit(2);
  }

  let chromium: PlaywrightChromium;
  try {
    chromium = await loadChromium();
  } catch (e) {
    report({ ok: false, error: (e as Error).message });
    process.exit(3);
  }

  const overallTimer = setTimeout(() => {
    report({ ok: false, error: `timed out after ${timeoutMs}ms` });
    process.exit(6);
  }, timeoutMs);
  overallTimer.unref();

  let browser: PwBrowser | undefined;
  try {
    browser = await chromium.connectOverCDP(cdpUrl);
    const allPages: PwPage[] = [];
    for (const ctx of browser.contexts()) {
      for (const p of ctx.pages()) allPages.push(p);
    }

    if (allPages.length === 0) {
      report({
        ok: false,
        error: `no CEF pages exposed by ${cdpUrl}. Ensure FiveM was started with the CEF DevTools port (default 13172) and that an NUI surface is live.`,
      });
      process.exit(4);
    }

    let chosen: PwPage | undefined;
    if (targetFilter) {
      chosen = allPages.find((p) => p.url().toLowerCase().includes(targetFilter));
    }
    if (!chosen) chosen = allPages.find((p) => isLikelyNui(p.url()));
    if (!chosen) chosen = allPages[0];

    const url = chosen!.url();
    const title = await chosen!.title().catch(() => '');

    const buffer = await chosen!.screenshot({ fullPage: true, type: 'png' });
    writeFileSync(outputPath, buffer);
    const bytes = (statSync(outputPath).size as number) ?? buffer.length;

    clearTimeout(overallTimer);
    report({
      ok: true,
      path: outputPath,
      bytes,
      target: { url, title },
      candidates: allPages.map((p) => p.url()),
    });
  } catch (e) {
    clearTimeout(overallTimer);
    report({ ok: false, error: e instanceof Error ? e.message : String(e) });
    process.exit(5);
  } finally {
    try {
      // Detach without killing the remote browser — we only connected.
      await browser?.close();
    } catch {
      // ignore
    }
  }
}

void main();
