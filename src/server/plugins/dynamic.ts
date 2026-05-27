/** Helpers shared by dynamic-dispatch plugins (esx, oxlib). */

const READ_VERBS = ['get', 'is', 'has', 'list', 'find', 'count', 'show', 'fetch', 'read', 'check'];
const WRITE_VERBS = [
  'set',
  'add',
  'remove',
  'update',
  'delete',
  'create',
  'do',
  'trigger',
  'kick',
  'ban',
  'give',
  'take',
  'spawn',
  'register',
  'unregister',
  'save',
  'reset',
  'clear',
  'send',
  'enable',
  'disable',
];

export type Mutation = 'read' | 'write' | 'unknown';

export function classifyMethod(name: string): Mutation {
  const lower = name.toLowerCase();
  for (const v of READ_VERBS) if (lower.startsWith(v)) return 'read';
  for (const v of WRITE_VERBS) if (lower.startsWith(v)) return 'write';
  return 'unknown';
}

export function isAllowed(
  name: string,
  ctx: { readonly: boolean; blocklist: Set<string> },
): { ok: true } | { ok: false; reason: string } {
  if (ctx.blocklist.has(name)) {
    return { ok: false, reason: `${name} is in the blocklist.` };
  }
  if (ctx.readonly) {
    const cls = classifyMethod(name);
    if (cls !== 'read') {
      return {
        ok: false,
        reason: `agent_api_readonly is true; only getter-style methods are allowed (got ${cls}).`,
      };
    }
  }
  return { ok: true };
}

export function listCallable(obj: unknown): string[] {
  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return [];
  const names = new Set<string>();
  for (const k of Object.keys(obj as object)) {
    if (typeof (obj as Record<string, unknown>)[k] === 'function') names.add(k);
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto && proto !== Object.prototype) {
    for (const k of Object.getOwnPropertyNames(proto)) {
      if (k === 'constructor') continue;
      const v = (obj as Record<string, unknown>)[k];
      if (typeof v === 'function') names.add(k);
    }
  }
  return [...names].sort();
}

const MAX_DEPTH = 6;
const MAX_ARRAY = 500;
const MAX_KEYS = 200;

export function safeSerialize(value: unknown, depth = 0, seen = new WeakSet()): unknown {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'function') {
    const fn = value as { name?: string };
    return `[Function: ${fn.name || 'anonymous'}]`;
  }
  if (t === 'bigint') return String(value);
  if (t === 'symbol') return String(value);
  if (t !== 'object') return value;

  if (depth > MAX_DEPTH) return '[depth-cap]';
  if (seen.has(value as object)) return '[circular]';
  seen.add(value as object);

  if (Array.isArray(value)) {
    const out = value.slice(0, MAX_ARRAY).map((v) => safeSerialize(v, depth + 1, seen));
    if (value.length > MAX_ARRAY) out.push(`[+${value.length - MAX_ARRAY} more]`);
    return out;
  }

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  let count = 0;
  for (const k of Object.keys(obj)) {
    if (count++ >= MAX_KEYS) {
      out['__truncated__'] = `(${Object.keys(obj).length - MAX_KEYS} more keys)`;
      break;
    }
    out[k] = safeSerialize(obj[k], depth + 1, seen);
  }
  return out;
}

export function csvSet(name: string): Set<string> {
  return new Set(
    GetConvar(name, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
