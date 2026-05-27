import { resolve, sep } from 'node:path';
import { Envelope, err, ok } from '../util/envelope';
import { getResourceInfo } from '../runtime/resources';

const DEFAULT_WRITE_EXTENSIONS = new Set([
  // FiveM runtime
  '.lua',
  '.cfg',
  // JS / TS family
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  // Web frameworks
  '.vue',
  '.svelte',
  '.astro',
  // Styles
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.styl',
  '.postcss',
  // Markup / docs
  '.html',
  '.htm',
  '.md',
  '.txt',
  // Data / config
  '.json',
  '.jsonc',
  '.yaml',
  '.yml',
  '.toml',
  '.xml',
  '.csv',
  '.env',
  '.example',
  // Tool dotfiles (filename "foo.gitignore" style)
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
  '.npmrc',
  '.nvmrc',
  '.prettierrc',
  '.eslintrc',
  '.eslintignore',
  '.prettierignore',
  // Vector assets (text)
  '.svg',
]);

function readExtraExtensions(): Set<string> {
  const raw = GetConvar('agent_api_extra_write_extensions', '');
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .map((s) => (s.startsWith('.') ? s : '.' + s)),
  );
}

function writeExtensions(): Set<string> {
  const out = new Set(DEFAULT_WRITE_EXTENSIONS);
  for (const e of readExtraExtensions()) out.add(e);
  return out;
}

function normalizeSlashes(p: string): string {
  return p.replaceAll('\\', '/').replaceAll(/\/{2,}/g, '/');
}

function lowerNorm(p: string): string {
  return normalizeSlashes(p).toLowerCase();
}

const BLOCKED_SEGMENTS = new Set(['.env', 'txdata', 'database', 'cache']);
const ALLOWED_EXTENSIONS = new Set([
  '.lua',
  '.js',
  '.ts',
  '.json',
  '.cfg',
  '.md',
  '.html',
  '.css',
  '.txt',
]);

function lowerExt(p: string): string {
  const i = p.lastIndexOf('.');
  return i < 0 ? '' : p.slice(i).toLowerCase();
}

function hasBlockedSegment(absPath: string, resourceRoot: string): boolean {
  const lowerAbs = absPath.toLowerCase();
  const lowerRoot = resourceRoot.toLowerCase();
  const inside = lowerAbs.startsWith(lowerRoot) ? lowerAbs.slice(lowerRoot.length) : lowerAbs;
  const segs = inside.split(/[\\/]+/).filter(Boolean);
  return segs.some((s) => BLOCKED_SEGMENTS.has(s));
}

export type ResolvedPath = {
  resource: string;
  resourceRoot: string;
  absPath: string;
  relPath: string;
};

export function resolveResourcePath(
  resourceName: string,
  relative: string,
): Envelope<ResolvedPath> {
  if (!relative || relative.startsWith('/') || relative.startsWith('\\')) {
    return err('PATH_OUTSIDE_SANDBOX', 'Path must be relative.');
  }
  if (/^[a-zA-Z]:[\\/]/.test(relative)) {
    return err('PATH_OUTSIDE_SANDBOX', 'Absolute paths are rejected.');
  }

  const info = getResourceInfo(resourceName);
  if (!info) {
    return err('RESOURCE_NOT_FOUND', `Resource not found: ${resourceName}`);
  }

  const root = resolve(info.path);
  const abs = resolve(root, relative);
  const rootWithSep = root.endsWith(sep) ? root : root + sep;

  if (!abs.startsWith(rootWithSep) && abs !== root) {
    return err('PATH_OUTSIDE_SANDBOX', 'Path escapes resource root.', {
      resource: resourceName,
      relative,
    });
  }

  if (hasBlockedSegment(abs, root)) {
    return err('PATH_BLOCKED', 'Path contains a blocked segment.', {
      blocked: [...BLOCKED_SEGMENTS],
    });
  }

  return ok({
    resource: resourceName,
    resourceRoot: root,
    absPath: abs,
    relPath: relative,
  });
}

export function checkReadExtension(absPath: string): Envelope<true> {
  const ext = lowerExt(absPath);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return err('EXTENSION_NOT_ALLOWED', `Extension not allowed: ${ext}`, {
      allowed: [...ALLOWED_EXTENSIONS],
    });
  }
  return ok(true);
}

export function checkWriteExtension(absPath: string): Envelope<true> {
  const ext = lowerExt(absPath);
  const allowed = writeExtensions();
  if (!allowed.has(ext)) {
    return err('EXTENSION_NOT_ALLOWED', `Write extension not allowed: ${ext}`, {
      allowed: [...allowed],
    });
  }
  return ok(true);
}

export function pathWithinAnyRoot(absPath: string, roots: string[]): boolean {
  const target = lowerNorm(absPath);
  return roots.some((root) => {
    const r = lowerNorm(root);
    if (!r) return false;
    return target.includes(`/${r}/`);
  });
}

export function checkWriteRoot(resourceAbsPath: string, writeRoots: string[]): Envelope<true> {
  if (!pathWithinAnyRoot(resourceAbsPath, writeRoots)) {
    return err('PATH_OUTSIDE_SANDBOX', 'Resource is not within any configured write root.', {
      writeRoots,
    });
  }
  return ok(true);
}

export function deriveWriteRootAbsolute(writeRoot: string): string | null {
  const ourPath = resolve(GetResourcePath(GetCurrentResourceName()));
  const lowerOur = lowerNorm(ourPath);
  const lowerRoot = lowerNorm(writeRoot);
  const needle = `/${lowerRoot}/`;
  const idx = lowerOur.indexOf(needle);
  if (idx < 0) return null;
  return normalizeSlashes(ourPath).slice(0, idx + 1 + writeRoot.length);
}

export const VALID_RESOURCE_NAME = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;
