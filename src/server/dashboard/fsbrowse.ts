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

export type FileNode = {
  name: string;
  type: 'dir' | 'file';
  children?: FileNode[];
};

export type TreeResult =
  | { ok: true; resource: string; sub: string; tree: FileNode[]; truncated: boolean }
  | { ok: false; reason: string };

const TREE_MAX_DEPTH = 6;
const TREE_MAX_NODES = 2_000;
const TREE_IGNORE = new Set(['node_modules', '.git', '.svn', '.hg']);

/** Build a recursive file/dir tree under <resource>/<sub> (read-only, sandboxed). */
export function buildTree(resource: string, sub: string): TreeResult {
  const rel = sub.trim() === '' ? '.' : sub.trim();
  const resolved = resolveResourcePath(resource, rel);
  if (!resolved.ok) return { ok: false, reason: resolved.error.message };

  let nodes = 0;
  let truncated = false;

  function walk(dir: string, depth: number): FileNode[] {
    if (depth > TREE_MAX_DEPTH || nodes >= TREE_MAX_NODES) {
      truncated = true;
      return [];
    }
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return [];
    }
    const out: FileNode[] = [];
    for (const name of names.sort((a, b) => a.localeCompare(b))) {
      if (name.startsWith('.') || TREE_IGNORE.has(name)) continue;
      if (nodes >= TREE_MAX_NODES) {
        truncated = true;
        break;
      }
      let isDir: boolean;
      try {
        isDir = statSync(join(dir, name)).isDirectory();
      } catch {
        continue;
      }
      nodes++;
      if (isDir) {
        out.push({ name, type: 'dir', children: walk(join(dir, name), depth + 1) });
      } else {
        out.push({ name, type: 'file' });
      }
    }
    // Directories first, then files, each alphabetical.
    return out.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  const tree = walk(resolved.data.absPath, 0);
  return { ok: true, resource, sub: sub.trim(), tree, truncated };
}
