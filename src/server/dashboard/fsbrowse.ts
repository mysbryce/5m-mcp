import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { listResources } from '../runtime/resources';
import { resolveResourcePath } from '../fs/sandbox';

export type BrowseResource = { name: string; state: string };

/** Resources the folder browser may point an example preference at. */
export function listResourcesForBrowse(): BrowseResource[] {
  return listResources()
    .filter((r) => r.state !== 'missing' && Boolean(r.path))
    .map((r) => ({ name: r.name, state: r.state }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type SubdirResult =
  | { ok: true; resource: string; sub: string; dirs: string[] }
  | { ok: false; reason: string };

/** List immediate child directories of `<resource>/<sub>` (read-only, sandboxed). */
export function listSubdirs(resource: string, sub: string): SubdirResult {
  const rel = sub.trim() === '' ? '.' : sub.trim();
  const resolved = resolveResourcePath(resource, rel);
  if (!resolved.ok) return { ok: false, reason: resolved.error.message };

  const base = resolved.data.absPath;
  let names: string[];
  try {
    names = readdirSync(base);
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'Cannot read directory.' };
  }

  const dirs = names
    .filter((n) => {
      if (n.startsWith('.') || n === 'node_modules') return false;
      try {
        return statSync(join(base, n)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.localeCompare(b));

  return { ok: true, resource, sub: sub.trim(), dirs };
}
