import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// A "work session" is the agent's task board for one resource. The agent
// publishes its current task + todo list here (via the track_work tool); the
// dashboard renders it read-only so a human can watch progress.

export type TodoStatus = 'pending' | 'in_progress' | 'done';
export type Todo = { text: string; status: TodoStatus };

export type WorkSession = {
  resource: string; // session id == resource name
  currentTask: string;
  todos: Todo[];
  createdAt: string;
  updatedAt: string;
};

const FILE = 'dist/tasks.json';
const MAX_TODOS = 100;
let cache: WorkSession[] | null = null;

function filePath(): string {
  const p = join(GetResourcePath(GetCurrentResourceName()), FILE);
  mkdirSync(dirname(p), { recursive: true });
  return p;
}

function load(): WorkSession[] {
  if (cache) return cache;
  const p = filePath();
  if (!existsSync(p)) {
    cache = [];
    return cache;
  }
  try {
    cache = JSON.parse(readFileSync(p, 'utf8')) as WorkSession[];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(): void {
  writeFileSync(filePath(), JSON.stringify(cache ?? [], null, 2), 'utf8');
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listSessions(): WorkSession[] {
  return [...load()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSession(resource: string): WorkSession | undefined {
  return load().find((s) => s.resource === resource);
}

/** Create an empty session for a resource if one does not exist yet. */
export function ensureSession(resource: string, currentTask = ''): WorkSession {
  const items = load();
  const existing = items.find((s) => s.resource === resource);
  if (existing) return existing;
  const session: WorkSession = {
    resource,
    currentTask,
    todos: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  items.push(session);
  persist();
  return session;
}

const STATUSES = new Set<TodoStatus>(['pending', 'in_progress', 'done']);

function sanitizeTodos(raw: unknown): Todo[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Todo[] = [];
  for (const item of raw.slice(0, MAX_TODOS)) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const text = typeof rec.text === 'string' ? rec.text.trim() : '';
    if (!text) continue;
    const status = STATUSES.has(rec.status as TodoStatus) ? (rec.status as TodoStatus) : 'pending';
    out.push({ text, status });
  }
  return out;
}

export type UpdateInput = {
  resource: string;
  currentTask?: string | undefined;
  todos?: unknown;
};

export type UpdateResult = { ok: true; session: WorkSession } | { ok: false; reason: string };

export function updateSession(input: UpdateInput): UpdateResult {
  const resource = (input.resource ?? '').trim();
  if (!resource) return { ok: false, reason: 'resource is required.' };

  const items = load();
  let session = items.find((s) => s.resource === resource);
  if (!session) {
    session = {
      resource,
      currentTask: '',
      todos: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    items.push(session);
  }

  if (input.currentTask !== undefined) {
    session.currentTask = String(input.currentTask).trim();
  }
  if (input.todos !== undefined) {
    const todos = sanitizeTodos(input.todos);
    if (todos === null) return { ok: false, reason: 'todos must be an array of {text, status}.' };
    session.todos = todos;
  }
  session.updatedAt = nowIso();
  persist();
  return { ok: true, session };
}

export function deleteSession(resource: string): { ok: true } | { ok: false; reason: string } {
  const items = load();
  if (!items.some((s) => s.resource === resource)) {
    return { ok: false, reason: 'Session not found.' };
  }
  cache = items.filter((s) => s.resource !== resource);
  persist();
  return { ok: true };
}
