/**
 * Stdio <-> HTTP bridge for MCP clients that only speak stdio.
 *
 * Read newline-delimited JSON-RPC frames from stdin, POST each to the
 * agent_api /mcp endpoint, write each response back to stdout.
 *
 * Config via env vars:
 *   AGENT_API_URL   default http://127.0.0.1:30120/agent_api/mcp
 *   AGENT_API_TOKEN required
 */

const url = process.env.AGENT_API_URL ?? 'http://127.0.0.1:30120/agent_api/mcp';
const token = process.env.AGENT_API_TOKEN;

if (!token) {
  process.stderr.write('[mcp-stdio] AGENT_API_TOKEN is required\n');
  process.exit(1);
}

function logErr(msg: string): void {
  process.stderr.write(`[mcp-stdio] ${msg}\n`);
}

async function forward(frame: string): Promise<void> {
  if (!frame.trim()) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(frame);
  } catch (e) {
    logErr(`bad JSON frame from stdin: ${(e as Error).message}`);
    return;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-token': token!,
      },
      body: JSON.stringify(parsed),
    });
  } catch (e) {
    logErr(`fetch failed: ${(e as Error).message}`);
    return;
  }

  if (res.status === 202) {
    // notification — no body to forward
    return;
  }

  const text = await res.text();
  if (!text) return;
  process.stdout.write(text + '\n');
}

let pending = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => {
  pending += chunk;
  let idx: number;
  while ((idx = pending.indexOf('\n')) >= 0) {
    const line = pending.slice(0, idx);
    pending = pending.slice(idx + 1);
    void forward(line);
  }
});

process.stdin.on('end', () => {
  if (pending.trim()) void forward(pending);
});

process.stdin.on('error', (e) => {
  logErr(`stdin error: ${e.message}`);
  process.exit(1);
});

logErr(`bridge ready -> ${url}`);
