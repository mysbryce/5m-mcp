import { session } from './session';

// Resolve the API base from the current pathname so the dashboard works
// under any host / port / resource name without configuration.
const BASE = location.pathname.replace(/\/dashboard.*$/, '/dashboard');
const API = `${BASE}/api`;

export type HttpMethod = 'GET' | 'POST' | 'DELETE';

export interface HttpResult<T> {
  status: number;
  ok: boolean;
  data: T;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function request<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown,
): Promise<HttpResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = session.get();
  if (token) headers['x-dashboard-session'] = token;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, ok: res.ok, data };
}

/** Throw on non-2xx, surfacing the server's `error` field. */
export async function requestOrThrow<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown,
): Promise<T> {
  const res = await request<T & { error?: string }>(path, method, body);
  if (!res.ok) throw new HttpError(res.status, res.data?.error ?? `Request failed (${res.status})`);
  return res.data;
}
