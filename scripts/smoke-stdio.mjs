#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const shimPath = join(repoRoot, 'dist', 'mcp-stdio.js');
const tokenPath = join(repoRoot, 'dist', '.agent_token');

if (!existsSync(shimPath)) {
  console.error(`Missing ${shimPath}. Run \`npm run build\` first.`);
  process.exit(1);
}

let token = process.env.AGENT_API_TOKEN;
if (!token && existsSync(tokenPath)) token = readFileSync(tokenPath, 'utf8').trim();
if (!token) {
  console.error('No token: set AGENT_API_TOKEN or ensure dist/.agent_token exists.');
  process.exit(1);
}

const URL = process.env.AGENT_API_URL ?? 'http://127.0.0.1:30120/agent_api/mcp';

const child = spawn(process.execPath, [shimPath], {
  env: { ...process.env, AGENT_API_TOKEN: token, AGENT_API_URL: URL },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stderrBuf = '';
child.stderr.on('data', (d) => {
  stderrBuf += d.toString();
});

let pending = '';
const pendingById = new Map();
child.stdout.on('data', (chunk) => {
  pending += chunk.toString();
  let idx;
  while ((idx = pending.indexOf('\n')) >= 0) {
    const line = pending.slice(0, idx).trim();
    pending = pending.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      const cb = pendingById.get(msg.id);
      if (cb) {
        pendingById.delete(msg.id);
        cb(msg);
      }
    } catch (e) {
      console.error(`bad JSON from shim: ${line}`);
    }
  }
});

let nextId = 1;
function rpc(method, params, expectReply = true) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const frame = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      ...(params === undefined ? {} : { params }),
    });
    if (expectReply) {
      const timer = setTimeout(() => {
        pendingById.delete(id);
        reject(new Error(`timeout waiting for reply to ${method}`));
      }, 5000);
      pendingById.set(id, (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    }
    child.stdin.write(frame + '\n');
    if (!expectReply) resolve(null);
  });
}

function notify(method, params) {
  const frame = JSON.stringify({ jsonrpc: '2.0', method, ...(params ? { params } : {}) });
  child.stdin.write(frame + '\n');
}

const tally = { pass: 0, fail: 0, failures: [] };
const pad = (s, n = 36) => s.padEnd(n);
function check(label, cond, detail = '') {
  const tag = cond ? 'OK ' : 'ERR';
  console.log(`[${tag}] ${pad(label)}${detail ? ' ' + detail : ''}`);
  if (cond) tally.pass++;
  else {
    tally.fail++;
    tally.failures.push(label);
  }
}

try {
  console.log(`shim  : ${shimPath}`);
  console.log(`target: ${URL}`);
  console.log(`token : ${token.slice(0, 8)}...\n`);

  const init = await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'smoke-stdio', version: '0.0.1' },
  });
  check(
    'initialize → result.serverInfo.name',
    init?.result?.serverInfo?.name === 'agent_api',
    init?.result?.serverInfo?.name ?? '<missing>',
  );
  check('initialize → tools capability present', !!init?.result?.capabilities?.tools);

  notify('notifications/initialized');
  // give shim a tick to forward; HTTP 202 → no stdout
  await new Promise((r) => setTimeout(r, 100));

  const list = await rpc('tools/list');
  const tools = list?.result?.tools ?? [];
  check('tools/list returns array', Array.isArray(tools), `count=${tools.length}`);
  check(
    'tools/list includes health',
    tools.some((t) => t.name === 'health'),
  );

  const health = await rpc('tools/call', { name: 'health', arguments: {} });
  check('tools/call health → isError=false', health?.result?.isError === false);
  const healthText = health?.result?.content?.[0]?.text;
  let healthParsed = null;
  try {
    healthParsed = JSON.parse(healthText);
  } catch {
    // ignore
  }
  check('tools/call health → text JSON has status=up', healthParsed?.status === 'up');

  const fxm = await rpc('tools/call', {
    name: 'read_file',
    arguments: { resource: 'agent_api', path: 'fxmanifest.lua' },
  });
  let fxmParsed = null;
  try {
    fxmParsed = JSON.parse(fxm?.result?.content?.[0]?.text ?? 'null');
  } catch {
    // ignore
  }
  check(
    'tools/call read_file → content includes fx_version',
    typeof fxmParsed?.content === 'string' && fxmParsed.content.includes('fx_version'),
  );

  const bad = await rpc('tools/call', { name: 'no_such_tool', arguments: {} });
  check('tools/call unknown → isError=true', bad?.result?.isError === true);

  const unknown = await rpc('does_not_exist');
  check('unknown method → JSON-RPC error -32601', unknown?.error?.code === -32601);

  console.log('');
  console.log(`Result: ${tally.pass}/${tally.pass + tally.fail} passed`);
  if (tally.fail) {
    console.log(`Failures:\n  - ${tally.failures.join('\n  - ')}`);
    process.exitCode = 1;
  }
} catch (e) {
  console.error('\n[smoke-stdio]', e instanceof Error ? e.message : String(e));
  if (stderrBuf) console.error('shim stderr:\n' + stderrBuf);
  process.exitCode = 1;
} finally {
  child.stdin.end();
  child.kill();
}
