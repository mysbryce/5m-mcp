// Self-contained dashboard SPA served by the agent_api HTTP handler.
// Vanilla JS + inline CSS so it can ship as a single string with no build step.

export const DASHBOARD_HTML = String.raw`<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>agent_api · dashboard</title>
<style>
  :root {
    --bg: oklch(0.16 0 0);
    --bg-soft: oklch(0.2 0 0);
    --card: oklch(0.22 0 0);
    --border: oklch(0.3 0 0);
    --fg: oklch(0.96 0 0);
    --muted: oklch(0.68 0 0);
    --primary: oklch(0.6049 0.1419 276.7);
    --primary-fg: oklch(1 0 0);
    --accent: oklch(0.832 0.1638 83.82);
    --danger: oklch(0.62 0.21 25);
    --radius: 10px;
    --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
    --sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--sans);
    font-size: 14px;
    line-height: 1.5;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
  a { color: var(--primary); text-decoration: none; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 0 20px; }

  /* top bar */
  header.topbar {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    height: 56px; padding: 0 20px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in oklch, var(--bg) 80%, transparent);
    backdrop-filter: blur(8px);
  }
  .brand { display: flex; align-items: center; gap: 8px; font-weight: 600; letter-spacing: -0.01em; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 12px oklch(0.6049 0.1419 276.7 / 0.8); }
  .badge { font-size: 10px; background: var(--bg-soft); color: var(--muted); border-radius: 5px; padding: 2px 6px; }
  .topbar .right { display: flex; align-items: center; gap: 12px; color: var(--muted); font-size: 13px; }

  /* auth card */
  .center { min-height: calc(100vh - 56px); display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth {
    width: 100%; max-width: 380px;
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 28px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.4);
  }
  .auth h1 { font-size: 20px; margin-bottom: 4px; }
  .auth p.sub { color: var(--muted); font-size: 13px; margin-bottom: 20px; }
  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  input, select {
    width: 100%; background: var(--bg-soft); color: var(--fg);
    border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px;
    font-size: 14px; font-family: var(--sans); outline: none;
  }
  input:focus, select:focus { border-color: var(--primary); }
  button {
    cursor: pointer; font-family: var(--sans); font-weight: 600; font-size: 14px;
    border: none; border-radius: 8px; padding: 9px 16px; transition: opacity .15s, background .15s;
  }
  button.primary { background: var(--primary); color: var(--primary-fg); width: 100%; }
  button.primary:hover { opacity: .9; }
  button.ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  button.ghost:hover { background: var(--bg-soft); color: var(--fg); }
  button.danger { background: transparent; color: var(--danger); border: 1px solid color-mix(in oklch, var(--danger) 40%, var(--border)); padding: 5px 10px; font-size: 12px; }
  button.danger:hover { background: color-mix(in oklch, var(--danger) 14%, transparent); }
  button:disabled { opacity: .45; cursor: not-allowed; }
  .msg { font-size: 13px; margin-top: 10px; min-height: 18px; }
  .msg.error { color: var(--danger); }
  .msg.ok { color: var(--accent); }

  /* app shell */
  main { padding: 28px 0 64px; }
  .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
  .tab { background: transparent; color: var(--muted); border-radius: 0; padding: 10px 14px; border-bottom: 2px solid transparent; font-weight: 500; }
  .tab.active { color: var(--fg); border-bottom-color: var(--primary); }
  .section-title { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
  .section-sub { color: var(--muted); font-size: 13px; margin-bottom: 20px; }

  .card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); }
  .group { margin-bottom: 22px; }
  .group h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: 10px; }
  .perm { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .perm:last-child { border-bottom: none; }
  .perm .meta { min-width: 0; }
  .perm .name { font-weight: 600; font-size: 13.5px; }
  .perm .desc { color: var(--muted); font-size: 12.5px; margin-top: 2px; }
  .perm .ctrl { flex-shrink: 0; width: 220px; max-width: 42vw; }
  .perm .ctrl input, .perm .ctrl select { font-size: 13px; }
  .switch { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
  .switch input { display: none; }
  .switch .track { width: 40px; height: 22px; border-radius: 999px; background: var(--bg-soft); border: 1px solid var(--border); transition: background .15s; position: relative; }
  .switch .track::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--muted); transition: transform .15s, background .15s; }
  .switch input:checked + .track { background: color-mix(in oklch, var(--primary) 40%, transparent); border-color: var(--primary); }
  .switch input:checked + .track::after { transform: translateX(18px); background: var(--primary); }

  .row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .row:last-child { border-bottom: none; }
  .row .u-name { font-weight: 600; }
  .row .u-meta { color: var(--muted); font-size: 12px; }
  .pill { font-size: 10px; padding: 2px 7px; border-radius: 999px; background: var(--bg-soft); color: var(--muted); margin-left: 8px; }
  .pill.master { background: color-mix(in oklch, var(--primary) 24%, transparent); color: var(--primary); }
  .toolbar { display: flex; gap: 10px; align-items: center; justify-content: flex-end; margin-top: 16px; }
  .inline-form { display: grid; grid-template-columns: 1fr 1fr auto auto; gap: 8px; padding: 14px 16px; border-top: 1px solid var(--border); }
  .hide { display: none !important; }
  .save-bar { position: sticky; bottom: 0; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 0; background: linear-gradient(to top, var(--bg), transparent); }
</style>
</head>
<body>
<header class="topbar">
  <div class="brand"><span class="dot"></span> agent_api <span class="badge">dashboard</span></div>
  <div class="right" id="userbar"></div>
</header>
<div id="root"></div>

<script>
const BASE = location.pathname.replace(/\/dashboard.*$/, '/dashboard');
const API = BASE + '/api';
let SESSION = localStorage.getItem('agent_api_session') || '';
let ME = null;
let PERMS = null;

function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

async function api(path, method, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (SESSION) headers['x-dashboard-session'] = SESSION;
  const res = await fetch(API + path, { method: method || 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function boot() {
  const { data } = await api('/auth/state');
  if (SESSION) {
    const me = await api('/auth/me');
    if (me.status === 200) { ME = me.data.user; return renderApp(); }
    SESSION = ''; localStorage.removeItem('agent_api_session');
  }
  renderAuth(data.signupOpen, data.userCount);
}

function renderAuth(signupOpen, userCount) {
  document.getElementById('userbar').innerHTML = '';
  const root = document.getElementById('root');
  const mode = signupOpen ? 'signup' : 'login';
  root.innerHTML = '';
  const card = h('<div class="center"><div class="auth"></div></div>');
  const box = card.querySelector('.auth');
  box.innerHTML =
    '<h1>' + (mode === 'signup' ? 'Create master account' : 'Sign in') + '</h1>' +
    '<p class="sub">' + (mode === 'signup'
      ? 'No users yet. The first account becomes the master and controls everything.'
      : 'Signup is closed. The master manages accounts from inside.') + '</p>' +
    '<div class="field"><label>Username</label><input id="u" autocomplete="username" /></div>' +
    '<div class="field"><label>Password</label><input id="p" type="password" autocomplete="current-password" /></div>' +
    '<button class="primary" id="go">' + (mode === 'signup' ? 'Create master' : 'Sign in') + '</button>' +
    '<div class="msg" id="m"></div>';
  root.appendChild(card);
  const msg = box.querySelector('#m');
  box.querySelector('#go').onclick = async () => {
    const username = box.querySelector('#u').value.trim();
    const password = box.querySelector('#p').value;
    msg.className = 'msg'; msg.textContent = 'Working…';
    const ep = mode === 'signup' ? '/auth/signup' : '/auth/login';
    const { status, data } = await api(ep, 'POST', { username, password });
    if (status === 200 && data.token) {
      SESSION = data.token; localStorage.setItem('agent_api_session', SESSION);
      ME = data.user; renderApp();
    } else {
      msg.className = 'msg error'; msg.textContent = data.error || 'Failed.';
    }
  };
  box.querySelector('#p').addEventListener('keydown', e => { if (e.key === 'Enter') box.querySelector('#go').click(); });
}

let TAB = 'permissions';
async function renderApp() {
  document.getElementById('userbar').innerHTML =
    '<span>' + esc(ME.username) + (ME.role === 'master' ? ' <span class="pill master">master</span>' : '') + '</span>' +
    '<button class="ghost" id="logout" style="padding:5px 10px;font-size:12px">Sign out</button>';
  document.getElementById('logout').onclick = async () => {
    await api('/auth/logout', 'POST');
    SESSION = ''; localStorage.removeItem('agent_api_session'); ME = null; boot();
  };
  const root = document.getElementById('root');
  root.innerHTML = '';
  const shell = h('<main><div class="wrap"><div class="tabs"></div><div id="view"></div></div></main>');
  const tabs = shell.querySelector('.tabs');
  const isMaster = ME.role === 'master';
  const tabDefs = [['permissions', 'Permissions']];
  if (isMaster) tabDefs.push(['users', 'Users']);
  for (const [id, label] of tabDefs) {
    const b = h('<button class="tab">' + label + '</button>');
    if (id === TAB) b.classList.add('active');
    b.onclick = () => { TAB = id; renderApp(); };
    tabs.appendChild(b);
  }
  root.appendChild(shell);
  if (TAB === 'users' && isMaster) renderUsers(shell.querySelector('#view'));
  else renderPermissions(shell.querySelector('#view'));
}

async function renderPermissions(view) {
  view.innerHTML = '<div class="section-title">Sandbox permissions</div><div class="section-sub">These map directly to agent_api convars. Changes apply live and persist across restarts.</div><div id="groups">Loading…</div>';
  const { data } = await api('/permissions');
  PERMS = data;
  const groups = {};
  for (const p of data.descriptors) { (groups[p.group] ||= []).push(p); }
  const wrap = view.querySelector('#groups');
  wrap.innerHTML = '';
  const draft = {};
  for (const [group, items] of Object.entries(groups)) {
    const g = h('<div class="group"><h3>' + esc(group) + '</h3><div class="card"></div></div>');
    const card = g.querySelector('.card');
    for (const p of items) {
      const val = data.values[p.convar];
      const row = h('<div class="perm"><div class="meta"><div class="name">' + esc(p.label) + '</div><div class="desc">' + esc(p.description) + '</div></div><div class="ctrl"></div></div>');
      const ctrl = row.querySelector('.ctrl');
      if (p.type === 'bool') {
        const sw = h('<label class="switch"><input type="checkbox"><span class="track"></span></label>');
        const cb = sw.querySelector('input'); cb.checked = val === 'true';
        cb.onchange = () => { draft[p.convar] = cb.checked ? 'true' : 'false'; };
        ctrl.appendChild(sw);
      } else if (p.type === 'enum') {
        const sel = h('<select></select>');
        for (const o of p.options) { const opt = h('<option>' + esc(o) + '</option>'); if (o === val) opt.selected = true; sel.appendChild(opt); }
        sel.onchange = () => { draft[p.convar] = sel.value; };
        ctrl.appendChild(sel);
      } else {
        const inp = h('<input>'); inp.value = val; inp.placeholder = p.type === 'csv' ? 'comma,separated' : '';
        inp.oninput = () => { draft[p.convar] = inp.value; };
        ctrl.appendChild(inp);
      }
      card.appendChild(row);
    }
    wrap.appendChild(g);
  }
  const bar = h('<div class="save-bar"><div class="msg" id="pm"></div><button class="primary" id="save" style="width:auto">Save changes</button></div>');
  view.appendChild(bar);
  const pm = bar.querySelector('#pm');
  bar.querySelector('#save').onclick = async () => {
    if (Object.keys(draft).length === 0) { pm.className = 'msg'; pm.textContent = 'Nothing changed.'; return; }
    pm.className = 'msg'; pm.textContent = 'Saving…';
    const { status, data } = await api('/permissions', 'POST', { updates: draft });
    if (status === 200) { pm.className = 'msg ok'; pm.textContent = 'Saved & applied live.'; for (const k in draft) delete draft[k]; }
    else { pm.className = 'msg error'; pm.textContent = data.error || 'Failed.'; }
  };
}

async function renderUsers(view) {
  view.innerHTML = '<div class="section-title">Users</div><div class="section-sub">Only the master can create or remove accounts. There is no public signup once the master exists.</div><div class="card" id="list">Loading…</div>';
  const { data } = await api('/users');
  const list = view.querySelector('#list');
  list.innerHTML = '';
  for (const u of data.users) {
    const row = h('<div class="row"><div><span class="u-name">' + esc(u.username) + '</span>' + (u.role === 'master' ? '<span class="pill master">master</span>' : '<span class="pill">member</span>') + '<div class="u-meta">since ' + esc(new Date(u.createdAt).toLocaleDateString()) + '</div></div></div>');
    if (u.role !== 'master') {
      const del = h('<button class="danger">Remove</button>');
      del.onclick = async () => { if (!confirm('Remove ' + u.username + '?')) return; await api('/users/' + u.id, 'DELETE'); renderUsers(view); };
      row.appendChild(del);
    }
    list.appendChild(row);
  }
  const form = h('<div class="inline-form"><input id="nu" placeholder="username" /><input id="np" type="password" placeholder="password (min 8)" /><select id="nr"><option value="member">member</option><option value="master">master</option></select><button class="primary" id="add" style="width:auto">Add</button></div>');
  list.appendChild(form);
  form.querySelector('#add').onclick = async () => {
    const username = form.querySelector('#nu').value.trim();
    const password = form.querySelector('#np').value;
    const role = form.querySelector('#nr').value;
    const { status, data } = await api('/users', 'POST', { username, password, role });
    if (status === 200) renderUsers(view);
    else alert(data.error || 'Failed.');
  };
}

boot();
</script>
</body>
</html>`;
