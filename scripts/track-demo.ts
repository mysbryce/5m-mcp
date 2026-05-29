/**
 * Offline demo of the work-tracking feature. Stubs the FiveM globals the stores
 * use, then walks the real create_resource -> track_work -> dashboard-request ->
 * inject -> resolve flow against the actual source modules. Run via:
 *   npx esbuild scripts/track-demo.ts --bundle --platform=node --format=esm --outfile=dist/_track-demo.mjs
 *   node dist/_track-demo.mjs
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TMP = mkdtempSync(join(tmpdir(), 'agent-track-'));

// Minimal FiveM runtime stubs. The stores only call these inside functions,
// so setting them here (before we invoke anything) is enough.
const g = globalThis as unknown as Record<string, unknown>;
g.GetResourcePath = () => TMP;
g.GetCurrentResourceName = () => 'agent_api';
g.GetConvar = (_name: string, fallback: string) => fallback;

const { ensureSession, updateSession, listSessions } =
  await import('../src/server/dashboard/tasks');
const { createRequest, pendingRequests, resolveRequest, pendingCount } =
  await import('../src/server/dashboard/requests');
const { injectedTexts } = await import('../src/server/dashboard/inject');

function line(s = ''): void {
  console.log(s);
}
function step(n: number, s: string): void {
  line(`\n── ${n}. ${s} ──`);
}

try {
  line('WORK-TRACKING OFFLINE DEMO (real store modules, stubbed FiveM env)');
  line(`scratch dir: ${TMP}`);

  step(1, 'agent runs create_resource a_b_c  →  auto-seed session');
  ensureSession('a_b_c', 'Scaffolded resource a_b_c');
  line(JSON.stringify(listSessions(), null, 2));

  step(2, 'agent calls track_work  →  current task + todos');
  updateSession({
    resource: 'a_b_c',
    currentTask: 'Wiring server inventory module',
    todos: [
      { text: 'Scaffold fxmanifest + server.lua', status: 'done' },
      { text: 'Add inventory open/close events', status: 'in_progress' },
      { text: 'Hook oxmysql persistence', status: 'pending' },
    ],
  });
  const board = listSessions()[0];
  line(`current: ${board?.currentTask}`);
  for (const t of board?.todos ?? []) line(`  [${t.status}] ${t.text}`);

  step(3, 'human clicks a file in the dashboard  →  queue a request');
  const created = createRequest({
    resource: 'a_b_c',
    path: 'server/main.lua',
    prompt: 'มีอะไรแปลกในไฟล์นี้ไหม? ต้อง refactor อะไรเพิ่ม?',
  });
  line(JSON.stringify(created, null, 2));

  step(4, 'human also asks about the whole resource (path = null)');
  createRequest({ resource: 'a_b_c', path: null, prompt: 'โครงสร้าง resource โอเคไหม?' });
  line(`pending requests now: ${pendingCount()}`);

  step(5, "what the agent SEES on its next tool result (injected into read_file's output)");
  for (const text of injectedTexts('read_file')) line(`  » ${text}`);

  step(6, 'agent calls get_requests  →  pending queue it must act on');
  const queue = pendingRequests();
  line(JSON.stringify(queue, null, 2));

  step(7, 'agent finishes one  →  resolve_request');
  resolveRequest(queue[0]!.id, 'ตรวจแล้ว: เพิ่ม nil-check ที่ event handler');
  line(`pending after resolve: ${pendingCount()}`);

  step(8, 'next tool result injection (one request left)');
  const after = injectedTexts('write_file');
  line(after.length ? `  » ${after.join('\n  » ')}` : '  (none)');

  line('\n✅ flow works end-to-end.');
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
