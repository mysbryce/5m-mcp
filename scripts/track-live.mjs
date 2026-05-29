#!/usr/bin/env node
// Live check for the work-tracking tools against the running agent_api server.
// Reads the token itself (never prints it). Run: node scripts/track-live.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const URL = process.env.AGENT_API_URL ?? 'http://127.0.0.1:30120/agent_api';
const tokenPath = join(repoRoot, 'dist', '.agent_token');

let token = process.env.AGENT_API_TOKEN;
if (!token && existsSync(tokenPath)) token = readFileSync(tokenPath, 'utf8').trim();
if (!token) {
  console.error('No token: set AGENT_API_TOKEN or ensure dist/.agent_token exists.');
  process.exit(1);
}

const h = { 'Content-Type': 'application/json', 'x-agent-token': token };
const post = async (name, input) =>
  (
    await fetch(`${URL}/tools/${name}`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify(input ?? {}),
    })
  ).json();
const get = async (p) => (await fetch(`${URL}${p}`, { headers: h })).json();

const RES = 'demo_track';

const tools = (await get('/tools')).data.tools.map((t) => t.name);
const NEW = ['track_work', 'track_get', 'get_requests', 'resolve_request'];
console.log(`tools on server: ${tools.length}`);
for (const n of NEW) console.log(`  ${tools.includes(n) ? 'PRESENT' : 'MISSING'}  ${n}`);
if (!NEW.every((n) => tools.includes(n))) {
  console.log('\nNew tools not live yet — resource still on old code. Re-ensure agent_api.');
  process.exit(1);
}

console.log('\n-- track_work --');
console.log(
  JSON.stringify(
    await post('track_work', {
      resource: RES,
      currentTask: 'Live verification of the tracking feature',
      todos: [
        { text: 'register tools', status: 'done' },
        { text: 'wire dashboard', status: 'in_progress' },
      ],
    }),
    null,
    2,
  ),
);

console.log('\n-- track_get --');
console.log(JSON.stringify(await post('track_get', { resource: RES }), null, 2));

console.log('\n-- get_requests (expect empty) --');
console.log(JSON.stringify(await post('get_requests', {}), null, 2));

console.log('\nLIVE OK — tools registered and responding.');
