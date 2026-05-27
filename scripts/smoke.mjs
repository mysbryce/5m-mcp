#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const URL = process.env.AGENT_API_URL ?? 'http://127.0.0.1:30120/agent_api';
const tokenPath = join(repoRoot, 'dist', '.agent_token');

let token = process.env.AGENT_API_TOKEN;
if (!token && existsSync(tokenPath)) {
  token = readFileSync(tokenPath, 'utf8').trim();
}
if (!token) {
  console.error('No token: set AGENT_API_TOKEN or ensure dist/.agent_token exists.');
  process.exit(1);
}

const pad = (s, n = 28) => s.padEnd(n);
const fmt = (obj) => JSON.stringify(obj, null, 2);

async function get(path) {
  const res = await fetch(`${URL}${path}`, { headers: { 'x-agent-token': token } });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function post(name, input) {
  const res = await fetch(`${URL}/tools/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-token': token,
    },
    body: JSON.stringify(input ?? {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

let rpcId = 1;
async function rpc(method, params) {
  const res = await fetch(`${URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-token': token,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: rpcId++,
      method,
      ...(params === undefined ? {} : { params }),
    }),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

function summarizeRpc(label, result, opts = {}) {
  const body = result.body;
  const isError = !!body?.error || body?.result?.isError === true;
  const expectFail = opts.expectFail;
  const passed = expectFail ? isError : !isError;
  const tag = passed ? 'OK ' : 'ERR';
  const detail = body?.error
    ? ` rpc:${body.error.code}`
    : body?.result?.isError
      ? ' tool-error'
      : '';
  const suffix = expectFail ? ' (expected reject)' : '';
  console.log(`[${tag}] ${pad(label)} (${result.status})${detail}${suffix}`);
  if (process.env.VERBOSE) {
    console.log(fmt(body));
    console.log('');
  }
}

function summarize(label, result, opts = {}) {
  const ok = result.body?.ok === true;
  const expectFail = opts.expectFail;
  const passed = expectFail ? !ok : ok;
  const tag = passed ? 'OK ' : 'ERR';
  const detail = ok ? '' : ` ${result.body?.error?.code ?? '?'}`;
  const suffix = expectFail ? ' (expected reject)' : '';
  console.log(`[${tag}] ${pad(label)} (${result.status})${detail}${suffix}`);
  if (process.env.VERBOSE) {
    console.log(fmt(result.body));
    console.log('');
  }
}

async function main() {
  console.log(`target: ${URL}`);
  console.log(`token : ${token.slice(0, 8)}...`);
  console.log('');

  summarize('GET  /health', await get('/health'));
  summarize('GET  /tools', await get('/tools'));
  summarize('health', await post('health'));
  summarize('list_resources', await post('list_resources'));
  summarize('get_resource_state', await post('get_resource_state', { name: 'agent_api' }));
  summarize(
    'read_file fxmanifest.lua',
    await post('read_file', { resource: 'agent_api', path: 'fxmanifest.lua' }),
  );
  summarize('tail_console', await post('tail_console', { lines: 5 }));
  summarize(
    'reject path escape',
    await post('read_file', { resource: 'agent_api', path: '../../../etc/passwd' }),
    { expectFail: true },
  );
  summarize(
    'reject unknown resource',
    await post('read_file', { resource: 'no_such_resource_xyz', path: 'foo.lua' }),
    { expectFail: true },
  );

  summarize('run_command players', await post('run_command', { command: 'players', waitMs: 300 }));
  summarize('reject banned command', await post('run_command', { command: 'quit' }), {
    expectFail: true,
  });
  summarize('reject unknown verb', await post('run_command', { command: 'rm -rf /' }), {
    expectFail: true,
  });
  summarize('refresh_resources', await post('refresh_resources', { waitMs: 300 }));
  const badAuth = await fetch(`${URL}/tools/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-token': 'wrong' },
    body: '{}',
  });
  summarize(
    'reject wrong token',
    { status: badAuth.status, body: await badAuth.json().catch(() => null) },
    { expectFail: true },
  );

  console.log('');
  console.log('-- live player testing (no opted-in subject expected) --');
  summarize('list_players', await post('list_players'));
  summarize(
    'reject get_player_state on non-subject',
    await post('get_player_state', { serverId: 999 }),
    { expectFail: true },
  );
  summarize(
    'reject register on non-opted-in',
    await post('register_test_subject', { serverId: 999 }),
    { expectFail: true },
  );

  console.log('');
  console.log('-- MCP transport --');
  summarizeRpc(
    'mcp initialize',
    await rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'smoke', version: '0.0.1' },
    }),
  );
  summarizeRpc('mcp tools/list', await rpc('tools/list'));
  summarizeRpc('mcp tools/call health', await rpc('tools/call', { name: 'health', arguments: {} }));
  summarizeRpc(
    'mcp tools/call read_file',
    await rpc('tools/call', {
      name: 'read_file',
      arguments: { resource: 'agent_api', path: 'fxmanifest.lua' },
    }),
  );
  summarizeRpc(
    'mcp tools/call unknown tool',
    await rpc('tools/call', { name: 'no_such_tool', arguments: {} }),
    { expectFail: true },
  );
  summarizeRpc('mcp unknown method', await rpc('does_not_exist'), { expectFail: true });

  console.log('');
  console.log('Tip: set VERBOSE=1 to see full envelopes.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
