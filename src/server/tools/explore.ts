import { readdirSync, readFileSync, statSync, type Stats } from 'node:fs';
import { join, relative } from 'node:path';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { escapeRegExp } from '../util/text';
import { checkReadExtension, resolveResourcePath } from '../fs/sandbox';
import { register } from './registry';

const SKIP_DIRS = new Set(['node_modules', 'txdata', 'database', 'cache']);
// Generated build output — skipped by default (set includeBuilt:true to include).
// Cuts huge token noise from minified bundles. Dot-dirs (.next/.nuxt/…) are
// already skipped by the leading-dot rule in walkFiles.
const BUILD_DIRS = new Set(['dist', 'build', 'out', 'coverage', 'vendor']);
const WALK_CAP = 4000;
const SEARCH_MAX_FILE_BYTES = 512 * 1024;

function safeStat(p: string): Stats | null {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function relForward(root: string, file: string): string {
  return relative(root, file).replaceAll('\\', '/');
}

/** Depth-first walk returning file paths, skipping noise/blocked dirs and dot-dirs. */
function walkFiles(base: string, maxFiles: number, includeBuilt: boolean): string[] {
  const out: string[] = [];
  const stack: string[] = [base];
  while (stack.length > 0 && out.length < maxFiles) {
    const dir = stack.pop();
    if (dir === undefined) break;
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const full = join(dir, name);
      const s = safeStat(full);
      if (!s) continue;
      if (s.isDirectory()) {
        const lower = name.toLowerCase();
        if (name.startsWith('.') || SKIP_DIRS.has(lower)) continue;
        if (!includeBuilt && BUILD_DIRS.has(lower)) continue;
        stack.push(full);
      } else if (s.isFile()) {
        out.push(full);
        if (out.length >= maxFiles) break;
      }
    }
  }
  return out;
}

function globToRegExp(glob: string): RegExp {
  let re = '^';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') i++;
        re += '.*';
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '/') {
      re += '/';
    } else if ('\\^$.|+()[]{}'.includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`${re}$`);
}

// --- list_dir ---

type DirEntry = { path: string; type: 'dir' | 'file'; size?: number | undefined };

function listDir(
  resource: string,
  sub: string,
  recursive: boolean,
  maxEntries: number,
  includeBuilt: boolean,
): Envelope<unknown> {
  const resolved = resolveResourcePath(resource, sub.trim() === '' ? '.' : sub.trim());
  if (!resolved.ok) return resolved;
  const { absPath, resourceRoot } = resolved.data;

  const entries: DirEntry[] = [];
  if (recursive) {
    for (const file of walkFiles(absPath, maxEntries, includeBuilt)) {
      const s = safeStat(file);
      entries.push({ path: relForward(resourceRoot, file), type: 'file', size: s?.size });
    }
  } else {
    let names: string[];
    try {
      names = readdirSync(absPath);
    } catch (e) {
      return err('NOT_FOUND', e instanceof Error ? e.message : 'Cannot read directory.');
    }
    for (const name of names.sort((a, b) => a.localeCompare(b))) {
      if (entries.length >= maxEntries) break;
      const s = safeStat(join(absPath, name));
      if (!s) continue;
      entries.push(
        s.isDirectory()
          ? { path: relForward(resourceRoot, join(absPath, name)), type: 'dir' }
          : { path: relForward(resourceRoot, join(absPath, name)), type: 'file', size: s.size },
      );
    }
  }

  return ok({
    resource,
    path: sub.trim(),
    entries,
    count: entries.length,
    truncated: entries.length >= maxEntries,
  });
}

// --- find_files (glob) ---

function findFiles(
  resource: string,
  pattern: string,
  maxResults: number,
  includeBuilt: boolean,
): Envelope<unknown> {
  const resolved = resolveResourcePath(resource, '.');
  if (!resolved.ok) return resolved;
  const re = globToRegExp(pattern);
  const matched: string[] = [];
  for (const file of walkFiles(resolved.data.absPath, WALK_CAP, includeBuilt)) {
    const rel = relForward(resolved.data.resourceRoot, file);
    if (re.test(rel)) {
      matched.push(rel);
      if (matched.length >= maxResults) break;
    }
  }
  return ok({ resource, pattern, files: matched, count: matched.length });
}

// --- search_code ---

type Match = { file: string; line: number; text: string };

function searchCode(
  resource: string,
  query: string,
  sub: string,
  isRegex: boolean,
  ignoreCase: boolean,
  maxResults: number,
  maxPerFile: number,
  includeBuilt: boolean,
): Envelope<unknown> {
  const resolved = resolveResourcePath(resource, sub.trim() === '' ? '.' : sub.trim());
  if (!resolved.ok) return resolved;

  let matcher: RegExp;
  const flags = ignoreCase ? 'i' : '';
  try {
    matcher = new RegExp(isRegex ? query : escapeRegExp(query), flags);
  } catch (e) {
    return err('INVALID_INPUT', `Invalid regex: ${e instanceof Error ? e.message : String(e)}`);
  }

  const { absPath, resourceRoot } = resolved.data;
  const matches: Match[] = [];
  for (const file of walkFiles(absPath, WALK_CAP, includeBuilt)) {
    if (matches.length >= maxResults) break;
    if (!checkReadExtension(file).ok) continue;
    const s = safeStat(file);
    if (!s || s.size > SEARCH_MAX_FILE_BYTES) continue;
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const rel = relForward(resourceRoot, file);
    const lines = content.split('\n');
    let perFile = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!matcher.test(lines[i]!)) continue;
      matches.push({ file: rel, line: i + 1, text: lines[i]!.trim().slice(0, 300) });
      perFile++;
      if (matches.length >= maxResults || perFile >= maxPerFile) break;
    }
  }

  return ok({ query, matches, count: matches.length, truncated: matches.length >= maxResults });
}

const ListDirInput = z
  .object({
    resource: z.string().min(1),
    path: z.string().optional(),
    recursive: z.boolean().optional(),
    maxEntries: z.number().int().min(1).max(2000).optional(),
    includeBuilt: z.boolean().optional(),
  })
  .strict();

const FindFilesInput = z
  .object({
    resource: z.string().min(1),
    pattern: z.string().min(1),
    maxResults: z.number().int().min(1).max(1000).optional(),
    includeBuilt: z.boolean().optional(),
  })
  .strict();

const SearchCodeInput = z
  .object({
    resource: z.string().min(1),
    query: z.string().min(1),
    path: z.string().optional(),
    isRegex: z.boolean().optional(),
    ignoreCase: z.boolean().optional(),
    maxResults: z.number().int().min(1).max(500).optional(),
    maxPerFile: z.number().int().min(1).max(100).optional(),
    includeBuilt: z.boolean().optional(),
  })
  .strict();

export function registerExploreTools(): void {
  register({
    name: 'list_dir',
    description:
      'List files and folders inside a resource. `recursive:true` returns the file tree. Skips ' +
      'node_modules / dot-dirs, and build output (dist, build, out, …) unless `includeBuilt:true`. ' +
      'Use this to map a resource before reading or editing.',
    input: ListDirInput,
    handler: async (input: z.infer<typeof ListDirInput>) =>
      listDir(
        input.resource,
        input.path ?? '',
        input.recursive ?? false,
        input.maxEntries ?? 500,
        input.includeBuilt ?? false,
      ),
  });

  register({
    name: 'find_files',
    description:
      'Find files in a resource by glob pattern (`**`, `*`, `?`), matched against the path ' +
      'relative to the resource root, e.g. `server/**/*.lua` or `**/*.vue`. Skips build output ' +
      '(dist, build, out, …) unless `includeBuilt:true`.',
    input: FindFilesInput,
    handler: async (input: z.infer<typeof FindFilesInput>) =>
      findFiles(
        input.resource,
        input.pattern,
        input.maxResults ?? 200,
        input.includeBuilt ?? false,
      ),
  });

  register({
    name: 'search_code',
    description:
      'Grep a resource for a substring (default) or regex (`isRegex:true`). Returns file/line/text ' +
      'matches. Scope to a subfolder with `path`. Skips binaries, non-text files, and build output ' +
      '(dist, build, out, …) unless `includeBuilt:true` — keeps results focused on source.',
    input: SearchCodeInput,
    handler: async (input: z.infer<typeof SearchCodeInput>) =>
      searchCode(
        input.resource,
        input.query,
        input.path ?? '',
        input.isRegex ?? false,
        input.ignoreCase ?? false,
        input.maxResults ?? 100,
        input.maxPerFile ?? 20,
        input.includeBuilt ?? false,
      ),
  });
}
