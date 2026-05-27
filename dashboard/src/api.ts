// API client for the agent_api dashboard. All calls are relative to the
// /dashboard/api base resolved from the current pathname so it works no
// matter what host/port/resource the dashboard is served under.

const BASE = location.pathname.replace(/\/dashboard.*$/, '/dashboard');
const API = BASE + '/api';

const SESSION_KEY = 'agent_api_session';

export function getSession(): string {
  return localStorage.getItem(SESSION_KEY) ?? '';
}
export function setSession(token: string): void {
  localStorage.setItem(SESSION_KEY, token);
}
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export type ApiResult<T> = { status: number; data: T };

export async function api<T = any>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const session = getSession();
  if (session) headers['x-dashboard-session'] = session;
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}

export type Role = 'master' | 'member';
export type PublicUser = { id: string; username: string; role: Role; createdAt: string };

export type PermDescriptor = {
  convar: string;
  label: string;
  group: string;
  type: 'bool' | 'csv' | 'int' | 'enum';
  description: string;
  options?: string[];
  default: string;
};
