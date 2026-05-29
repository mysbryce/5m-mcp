import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// A queue of human-issued requests aimed at the agent. The dashboard pushes a
// request (e.g. "review this file") targeting a resource and optional subpath;
// the agent reads pending ones via get_requests, acts, then resolve_request.
// The agent is told about pending requests through injected tool-result text
// (see dashboard/inject.ts), so it notices them on its next tool call.

export type RequestStatus = 'pending' | 'done';

export type WorkRequest = {
  id: string;
  resource: string;
  path: string | null; // null == the whole resource (no specific path)
  prompt: string;
  status: RequestStatus;
  createdAt: string;
  resolvedAt?: string | undefined;
  note?: string | undefined;
};

const FILE = 'dist/requests.json';
const MAX_PROMPT_CHARS = 4_000;
const MAX_KEPT = 500; // cap stored history (oldest resolved pruned first)
let cache: WorkRequest[] | null = null;

function filePath(): string {
  const p = join(GetResourcePath(GetCurrentResourceName()), FILE);
  mkdirSync(dirname(p), { recursive: true });
  return p;
}

function load(): WorkRequest[] {
  if (cache) return cache;
  const p = filePath();
  if (!existsSync(p)) {
    cache = [];
    return cache;
  }
  try {
    cache = JSON.parse(readFileSync(p, 'utf8')) as WorkRequest[];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(): void {
  writeFileSync(filePath(), JSON.stringify(cache ?? [], null, 2), 'utf8');
}

export function listRequests(status?: RequestStatus): WorkRequest[] {
  const items = load();
  const filtered = status ? items.filter((r) => r.status === status) : items;
  return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pendingRequests(): WorkRequest[] {
  return listRequests('pending');
}

export function pendingCount(): number {
  return load().reduce((n, r) => (r.status === 'pending' ? n + 1 : n), 0);
}

export type CreateInput = { resource: string; path?: string | null; prompt: string };
export type CreateResult = { ok: true; request: WorkRequest } | { ok: false; reason: string };

export function createRequest(input: CreateInput): CreateResult {
  const resource = (input.resource ?? '').trim();
  if (!resource) return { ok: false, reason: 'resource is required.' };
  const prompt = (input.prompt ?? '').trim();
  if (!prompt) return { ok: false, reason: 'prompt is required.' };
  if (prompt.length > MAX_PROMPT_CHARS) {
    return { ok: false, reason: `prompt exceeds ${MAX_PROMPT_CHARS} characters.` };
  }
  const path = input.path ? String(input.path).trim() : null;

  const items = load();
  const request: WorkRequest = {
    id: randomBytes(6).toString('hex'),
    resource,
    path: path || null,
    prompt,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  items.push(request);
  // Prune oldest resolved entries if we exceed the cap.
  if (items.length > MAX_KEPT) {
    const keep = items
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .filter((r) => r.status === 'pending');
    const resolved = items
      .filter((r) => r.status !== 'pending')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.max(0, MAX_KEPT - keep.length));
    cache = [...keep, ...resolved];
  }
  persist();
  return { ok: true, request };
}

export function resolveRequest(
  id: string,
  note?: string,
): { ok: true; request: WorkRequest } | { ok: false; reason: string } {
  const items = load();
  const request = items.find((r) => r.id === id);
  if (!request) return { ok: false, reason: 'Request not found.' };
  request.status = 'done';
  request.resolvedAt = new Date().toISOString();
  if (note !== undefined) request.note = String(note).slice(0, 500);
  persist();
  return { ok: true, request };
}
