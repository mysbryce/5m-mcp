import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';

const AUDIT_FILE = 'dist/audit.log';
// Params can carry whole file bodies (write_file). Cap what we persist so the
// log does not balloon or leak large payloads; keep a short preview only.
const MAX_PARAM_CHARS = 2_000;
// Rotate once the log passes this size, keeping a single .1 backup.
const MAX_AUDIT_BYTES = 5 * 1024 * 1024;
let resolvedPath: string | null = null;

function truncateParams(params: unknown): unknown {
  let serialized: string;
  try {
    serialized = JSON.stringify(params);
  } catch {
    return '[unserializable]';
  }
  if (serialized === undefined || serialized.length <= MAX_PARAM_CHARS) return params;
  return {
    _truncated: true,
    _chars: serialized.length,
    preview: serialized.slice(0, MAX_PARAM_CHARS),
  };
}

function rotateIfNeeded(p: string): void {
  try {
    if (statSync(p).size > MAX_AUDIT_BYTES) {
      renameSync(p, p + '.1'); // overwrites any previous backup
    }
  } catch {
    // no file yet, or rename failed — not fatal
  }
}

function path(): string {
  if (resolvedPath) return resolvedPath;
  const root = GetResourcePath(GetCurrentResourceName());
  resolvedPath = join(root, AUDIT_FILE);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return resolvedPath;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 12);
}

export type AuditEntry = {
  ts: string;
  tool: string;
  params: unknown;
  result_code: string;
  caller: string;
};

export function audit(entry: Omit<AuditEntry, 'ts'>): void {
  const safe = { ...entry, params: truncateParams(entry.params) };
  const line = JSON.stringify({ ts: new Date().toISOString(), ...safe }) + '\n';
  try {
    const p = path();
    rotateIfNeeded(p);
    appendFileSync(p, line, 'utf8');
  } catch (e) {
    console.error(`[${GetCurrentResourceName()}] audit write failed:`, e);
  }
}

/** Most-recent audit entries (newest last), parsed from the log file. */
export function readRecentAudit(limit: number): AuditEntry[] {
  const p = path();
  if (!existsSync(p)) return [];
  let text: string;
  try {
    text = readFileSync(p, 'utf8');
  } catch {
    return [];
  }
  const lines = text.split('\n').filter(Boolean).slice(-limit);
  const out: AuditEntry[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as AuditEntry);
    } catch {
      // skip malformed line
    }
  }
  return out;
}
