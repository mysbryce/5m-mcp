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

  summarize('run_command status', await post('run_command', { command: 'status', waitMs: 300 }));
  summarize(
    'reject banned command',
    await post('run_command', { command: 'quit' }),
    { expectFail: true },
  );
  summarize(
    'reject unknown verb',
    await post('run_command', { command: 'rm -rf /' }),
    { expectFail: true },
  );
  summarize(
    'ensure_resource (self)',
    await post('ensure_resource', { name: 'agent_api' }),
  );
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
  console.log('Tip: set VERBOSE=1 to see full envelopes.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
