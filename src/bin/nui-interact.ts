/**
 * NUI interaction helper. Spawned by the nui_* MCP tools.
 *
 * Argv:
 *   1. action        — eval | click | fill | get
 *   2. cdpUrl        — default http://localhost:13172
 *   3. timeoutMs     — default 15000
 *   4. targetFilter  — optional substring; first target URL containing it wins
 *                      (pass the resource name to drive that resource's iframe)
 *   5. payloadJson   — { selector?, value?, expression? }
 *
 * Talks to FiveM's CEF over raw CDP (no Playwright). Picks the matching page/
 * iframe target, then runs Runtime.evaluate in that target's context. Targeting
 * the resource's own iframe sidesteps cross-origin reach from the top document.
 */

type CdpTarget = {
  id: string;
  type: string;
  url: string;
  title: string;
  webSocketDebuggerUrl: string;
};

type Payload = { selector?: string; value?: string; expression?: string };

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

async function listTargets(cdpUrl: string): Promise<CdpTarget[]> {
  const r = await fetch(`${cdpUrl.replace(/\/$/, '')}/json`);
  if (!r.ok) throw new Error(`CDP /json returned ${r.status}`);
  const arr = (await r.json()) as CdpTarget[];
  return arr.filter((p) => (p.type === 'page' || p.type === 'iframe') && !!p.webSocketDebuggerUrl);
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

function buildExpression(action: string, p: Payload): string {
  const sel = JSON.stringify(p.selector ?? '');
  const val = JSON.stringify(p.value ?? '');
  switch (action) {
    case 'eval':
      return p.expression ?? 'undefined';
    case 'click':
      return `(() => {
        const el = document.querySelector(${sel});
        if (!el) return { found: false };
        if (el.scrollIntoView) el.scrollIntoView({ block: 'center' });
        el.click();
        return { found: true, tag: el.tagName };
      })()`;
    case 'fill':
      return `(() => {
        const el = document.querySelector(${sel});
        if (!el) return { found: false };
        if (el.focus) el.focus();
        const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) desc.set.call(el, ${val}); else el.value = ${val};
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { found: true, value: el.value };
      })()`;
    case 'get':
      return `(() => {
        const el = document.querySelector(${sel});
        if (!el) return { found: false };
        const r = el.getBoundingClientRect();
        return {
          found: true,
          tag: el.tagName,
          text: (el.textContent || '').trim().slice(0, 1000),
          value: ('value' in el) ? el.value : undefined,
          rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          html: el.outerHTML.slice(0, 1000),
        };
      })()`;
    default:
      return 'undefined';
  }
}

async function main(): Promise<void> {
  const action = process.argv[2] ?? '';
  const cdpUrl = process.argv[3] ?? 'http://localhost:13172';
  const timeoutMs = Number(process.argv[4] ?? '15000');
  const targetFilter = (process.argv[5] ?? '').toLowerCase();
  let payload: Payload = {};
  try {
    payload = JSON.parse(process.argv[6] ?? '{}') as Payload;
  } catch {
    report({ ok: false, error: 'invalid payload JSON' });
    process.exit(2);
  }

  if (!['eval', 'click', 'fill', 'get'].includes(action)) {
    report({ ok: false, error: `unknown action: ${action}` });
    process.exit(2);
  }

  let targets: CdpTarget[];
  try {
    targets = await listTargets(cdpUrl);
  } catch (e) {
    report({ ok: false, error: `cannot reach CDP at ${cdpUrl}: ${(e as Error).message}` });
    process.exit(3);
  }
  if (targets.length === 0) {
    report({ ok: false, error: `no targets exposed by ${cdpUrl}. Is the FiveM client running?` });
    process.exit(4);
  }

  let chosen: CdpTarget | undefined;
  if (targetFilter) chosen = targets.find((p) => p.url.toLowerCase().includes(targetFilter));
  if (!chosen) chosen = targets.find((p) => isLikelyNui(p.url));
  if (!chosen) chosen = targets[0];

  const client = new CdpClient(chosen!.webSocketDebuggerUrl);
  try {
    await client.ready(timeoutMs);
    const expression = buildExpression(action, payload);
    const res = await client.send<{
      result?: { value?: unknown };
      exceptionDetails?: { exception?: { description?: string }; text?: string };
    }>('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, timeoutMs);

    if (res.exceptionDetails) {
      const msg =
        res.exceptionDetails.exception?.description ?? res.exceptionDetails.text ?? 'eval error';
      report({ ok: false, error: msg, target: { url: chosen!.url, id: chosen!.id } });
      client.close();
      process.exit(6);
    }

    report({
      ok: true,
      action,
      result: res.result?.value,
      target: { url: chosen!.url, title: chosen!.title, id: chosen!.id },
      candidates: targets.map((p) => ({ url: p.url, title: p.title, type: p.type })),
    });
  } catch (e) {
    report({ ok: false, error: e instanceof Error ? e.message : String(e) });
    process.exit(5);
  } finally {
    client.close();
  }
}

void main();
