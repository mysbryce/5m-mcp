import { dashboardHtml } from './html';
import {
  createUser,
  deleteUser,
  findById,
  findByUsername,
  listUsers,
  signupOpen,
  toPublic,
  userCount,
  verifyPassword,
  type Role,
} from './users';
import { createSession, destroySession, destroyUserSessions, getSessionUserId } from './sessions';
import { PERMISSIONS, applyUpdates, currentValues } from './permissions';

type Reply = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const HTML_HEADERS = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' };

function json(status: number, data: unknown): Reply {
  return { status, headers: JSON_HEADERS, body: JSON.stringify(data) };
}

function meFromHeaders(headers: Record<string, string>) {
  const token = headers['x-dashboard-session'];
  const userId = getSessionUserId(token);
  if (!userId) return null;
  const user = findById(userId);
  return user ? { user, token } : null;
}

export type DashboardDeps = { reloadConvars: () => void };

/**
 * Handle a /dashboard request. `path` is everything after the resource name,
 * e.g. "/dashboard" or "/dashboard/api/permissions".
 */
export async function handleDashboard(
  method: string,
  path: string,
  headers: Record<string, string>,
  body: string,
  deps: DashboardDeps,
): Promise<Reply> {
  const sub = path.slice('/dashboard'.length).replace(/\/$/, '');

  // Serve the SPA
  if (sub === '' || sub === '/' || (!sub.startsWith('/api') && method === 'GET')) {
    return { status: 200, headers: HTML_HEADERS, body: dashboardHtml() };
  }

  let parsed: Record<string, unknown> = {};
  if (body) {
    try {
      parsed = JSON.parse(body) as Record<string, unknown>;
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }
  }

  // --- public auth ---
  if (sub === '/api/auth/state' && method === 'GET') {
    return json(200, { signupOpen: signupOpen(), userCount: userCount() });
  }

  if (sub === '/api/auth/signup' && method === 'POST') {
    if (!signupOpen()) {
      return json(403, { error: 'Signup is closed. Ask the master to create your account.' });
    }
    const username = String(parsed.username ?? '');
    const password = String(parsed.password ?? '');
    const result = createUser(username, password, 'master');
    if (!result.ok) return json(400, { error: result.reason });
    const token = createSession(result.user.id);
    return json(200, { token, user: toPublic(result.user) });
  }

  if (sub === '/api/auth/login' && method === 'POST') {
    const username = String(parsed.username ?? '');
    const password = String(parsed.password ?? '');
    const user = findByUsername(username);
    if (!user || !verifyPassword(user, password)) {
      return json(401, { error: 'Invalid username or password.' });
    }
    const token = createSession(user.id);
    return json(200, { token, user: toPublic(user) });
  }

  // --- authenticated ---
  const session = meFromHeaders(headers);
  if (!session) return json(401, { error: 'Not authenticated.' });
  const { user, token } = session;

  if (sub === '/api/auth/me' && method === 'GET') {
    return json(200, { user: toPublic(user) });
  }

  if (sub === '/api/auth/logout' && method === 'POST') {
    destroySession(token);
    return json(200, { ok: true });
  }

  if (sub === '/api/permissions' && method === 'GET') {
    return json(200, { descriptors: PERMISSIONS, values: currentValues() });
  }

  if (sub === '/api/permissions' && method === 'POST') {
    const updates = (parsed.updates ?? {}) as Record<string, unknown>;
    const result = applyUpdates(updates, deps.reloadConvars);
    if (!result.ok) return json(400, { error: result.reason });
    return json(200, { values: result.values });
  }

  // --- master only ---
  if (sub.startsWith('/api/users')) {
    if (user.role !== 'master') return json(403, { error: 'Master only.' });

    if (sub === '/api/users' && method === 'GET') {
      return json(200, { users: listUsers() });
    }
    if (sub === '/api/users' && method === 'POST') {
      const username = String(parsed.username ?? '');
      const password = String(parsed.password ?? '');
      const role = (parsed.role === 'master' ? 'master' : 'member') as Role;
      const result = createUser(username, password, role);
      if (!result.ok) return json(400, { error: result.reason });
      return json(200, { user: toPublic(result.user) });
    }
    const delMatch = sub.match(/^\/api\/users\/([a-f0-9]+)$/);
    if (delMatch && method === 'DELETE') {
      const id = delMatch[1]!;
      if (id === user.id) return json(400, { error: 'You cannot remove your own account.' });
      const result = deleteUser(id);
      if (!result.ok) return json(400, { error: result.reason });
      destroyUserSessions(id);
      return json(200, { ok: true });
    }
  }

  return json(404, { error: 'Unknown dashboard route.' });
}
