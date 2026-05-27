/**
 * NUI screenshot helper. Spawned by the screenshot_nui MCP tool.
 *
 * Argv:
 *   1. outputPath      — absolute PNG output path
 *   2. cdpUrl          — default http://localhost:13172
 *   3. timeoutMs       — default 15000
 *   4. targetFilter    — optional substring; first page URL containing it wins
 *   5. iframeName      — optional; clip screenshot to <iframe name="..."> rect
 *
 * Strategy:
 *   Talk to FiveM's CEF over raw CDP — no playwright (CEF rejects its setup
 *   handshake). Steps:
 *     1. fetch <cdpUrl>/json, pick the first NUI page target
 *     2. open the page's webSocketDebuggerUrl
 *     3. if iframeName: Runtime.evaluate to read getBoundingClientRect of
 *        iframe[name="<x>"], then Page.captureScreenshot with clip
 *     4. else: Page.captureScreenshot of the whole root
 */

import { writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

type CdpPage = {
  id: string;
  type: string;
  url: string;
  title: string;
  webSocketDebuggerUrl: string;
};

type Rect = { x: number; y: number; width: number; height: number };

function report(payload: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(payload) + '\n');
}

function isLikelyNui(url: string): boolean {
  const u = url.toLowerCase();
  if (u.startsWith('devtools://')) return false;
  if (u.startsWith('chrome://')) return false;
  if (u.startsWith('chrome-untrusted://')) return false;
  if (u === 'about:blank') return false;
  return true;
}

async function listTargets(cdpUrl: string): Promise<CdpPage[]> {
  const r = await fetch(`${cdpUrl.replace(/\/$/, '')}/json`);
  if (!r.ok) throw new Error(`CDP /json returned ${r.status}`);
  const arr = (await r.json()) as CdpPage[];
  return arr.filter((p) => p.type === 'page' && !!p.webSocketDebuggerUrl);
}

class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<
    number,
    (msg: { result?: unknown; error?: { message: string } }) => void
  >();

  constructor(wsUrl: string) {
    const WS: typeof WebSocket = (globalThis as { WebSocket?: typeof WebSocket }).WebSocket!;
    if (!WS) throw new Error('WebSocket not available (need Node 22+).');
    this.ws = new WS(wsUrl);
    this.ws.addEventListener('message', (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
        if (typeof msg.id !== 'number') return;
        const cb = this.pending.get(msg.id);
        if (cb) {
          this.pending.delete(msg.id);
          cb(msg);
        }
      } catch {
        // ignore
      }
    });
  }

  ready(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === 1) {
        resolve();
        return;
      }
      const t = setTimeout(() => reject(new Error('ws open timeout')), timeoutMs);
      this.ws.addEventListener('open', () => {
        clearTimeout(t);
        resolve();
      });
      this.ws.addEventListener('error', (e: Event) => {
        clearTimeout(t);
        const msg = (e as Event & { message?: string }).message ?? 'unknown';
        reject(new Error(`ws error: ${msg}`));
      });
    });
  }

  send<T = unknown>(method: string, params: unknown = {}, timeoutMs = 10_000): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, (msg) => {
        clearTimeout(t);
        if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
        else resolve(msg.result as T);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close(): void {
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }
}

async function findIframeRect(client: CdpClient, name: string): Promise<Rect | null> {
  const expr = `(() => {
    const sel = ${JSON.stringify(`iframe[name="${name.replaceAll('"', '\\"')}"]`)};
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`;
  const res = await client.send<{ result?: { value?: Rect | null } }>('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
  });
  return res.result?.value ?? null;
}

async function hideSiblingIframes(client: CdpClient, keepName: string): Promise<string[]> {
  const expr = `(() => {
    const keep = ${JSON.stringify(keepName)};
    const hidden = [];
    for (const f of document.querySelectorAll('iframe')) {
      if (f.getAttribute('name') === keep) continue;
      f.dataset.agentApiPrevDisplay = f.style.display || '';
      f.style.display = 'none';
      hidden.push(f.getAttribute('name') || '');
    }
    return hidden;
  })()`;
  const res = await client.send<{ result?: { value?: string[] } }>('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
  });
  return res.result?.value ?? [];
}

async function restoreSiblingIframes(client: CdpClient): Promise<void> {
  const expr = `(() => {
    for (const f of document.querySelectorAll('iframe')) {
      if (f.dataset.agentApiPrevDisplay !== undefined) {
        f.style.display = f.dataset.agentApiPrevDisplay;
        delete f.dataset.agentApiPrevDisplay;
      }
    }
    return true;
  })()`;
  await client.send('Runtime.evaluate', { expression: expr, returnByValue: true }).catch(() => {
    // best-effort restore — never throw out of cleanup
  });
}

async function main(): Promise<void> {
  const outputPath = process.argv[2];
  const cdpUrl = process.argv[3] ?? 'http://localhost:13172';
  const timeoutMs = Number(process.argv[4] ?? '15000');
  const targetFilter = (process.argv[5] ?? '').toLowerCase();
  const iframeName = process.argv[6] ?? '';
  const mode = (process.argv[7] ?? 'isolate').toLowerCase() as 'isolate' | 'clip' | 'full';

  if (!outputPath) {
    report({
      ok: false,
      error:
        'usage: screenshot-nui <outputPath> [cdpUrl] [timeoutMs] [targetFilter] [iframeName] [mode=isolate|clip|full]',
    });
    process.exit(2);
  }

  try {
    mkdirSync(dirname(outputPath), { recursive: true });
  } catch (e) {
    report({ ok: false, error: `mkdir failed: ${(e as Error).message}` });
    process.exit(2);
  }

  let targets: CdpPage[];
  try {
    targets = await listTargets(cdpUrl);
  } catch (e) {
    report({ ok: false, error: `cannot reach CDP at ${cdpUrl}: ${(e as Error).message}` });
    process.exit(3);
  }

  if (targets.length === 0) {
    report({
      ok: false,
      error: `no page targets exposed by ${cdpUrl}. Ensure the FiveM client is running.`,
    });
    process.exit(4);
  }

  let chosen: CdpPage | undefined;
  if (targetFilter) chosen = targets.find((p) => p.url.toLowerCase().includes(targetFilter));
  if (!chosen) chosen = targets.find((p) => isLikelyNui(p.url));
  if (!chosen) chosen = targets[0];

  const client = new CdpClient(chosen!.webSocketDebuggerUrl);
  let restoredHidden: string[] = [];
  try {
    await client.ready(timeoutMs);

    let clip: Rect | null = null;
    let iframeReport: Record<string, unknown> | undefined;

    if (iframeName) {
      const rect = await findIframeRect(client, iframeName);
      iframeReport = { name: iframeName, found: !!rect, rect };
      if (!rect) {
        report({
          ok: false,
          error: `iframe[name="${iframeName}"] not found in ${chosen!.url}. Is the resource's UI open?`,
          iframe: iframeReport,
        });
        client.close();
        process.exit(7);
      }
      if (rect.width < 1 || rect.height < 1) {
        report({
          ok: false,
          error: `iframe[name="${iframeName}"] has zero size (${rect.width}x${rect.height}) — UI is likely hidden.`,
          iframe: iframeReport,
        });
        client.close();
        process.exit(8);
      }
      if (mode === 'clip') clip = rect;
      if (mode === 'isolate') restoredHidden = await hideSiblingIframes(client, iframeName);
    }

    const screenshotParams: Record<string, unknown> = {
      format: 'png',
      fromSurface: true,
    };
    if (clip) {
      screenshotParams.clip = { ...clip, scale: 1 };
    }

    const res = await client.send<{ data: string }>(
      'Page.captureScreenshot',
      screenshotParams,
      timeoutMs,
    );
    if (!res.data) throw new Error('CDP response missing result.data');

    const buffer = Buffer.from(res.data, 'base64');
    writeFileSync(outputPath, buffer);
    const bytes = (statSync(outputPath).size as number) ?? buffer.length;

    report({
      ok: true,
      path: outputPath,
      bytes,
      mode,
      target: { url: chosen!.url, title: chosen!.title, id: chosen!.id },
      candidates: targets.map((p) => ({ url: p.url, title: p.title })),
      iframe: iframeReport,
      hiddenSiblings: restoredHidden,
    });
  } catch (e) {
    report({ ok: false, error: e instanceof Error ? e.message : String(e) });
    process.exit(5);
  } finally {
    if (restoredHidden.length > 0) await restoreSiblingIframes(client);
    client.close();
  }
}

void main();
