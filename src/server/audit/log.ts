import { appendFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";

const AUDIT_FILE = "dist/audit.log";
let resolvedPath: string | null = null;

function path(): string {
  if (resolvedPath) return resolvedPath;
  const root = GetResourcePath(GetCurrentResourceName());
  resolvedPath = join(root, AUDIT_FILE);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return resolvedPath;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 12);
}

export type AuditEntry = {
  ts: string;
  tool: string;
  params: unknown;
  result_code: string;
  caller: string;
};

export function audit(entry: Omit<AuditEntry, "ts">): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
  try {
    appendFileSync(path(), line, "utf8");
  } catch (e) {
    console.error(`[${GetCurrentResourceName()}] audit write failed:`, e);
  }
}
