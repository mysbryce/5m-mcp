import { resolve, sep } from 'node:path';
import { Envelope, err, ok } from '../util/envelope';
import { getResourceInfo } from '../runtime/resources';

const BLOCKED_SEGMENTS = ['.env', 'txData', 'database', 'cache'];
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

function hasBlockedSegment(absPath: string): boolean {
  const segs = absPath.toLowerCase().split(/[\\/]+/);
  return BLOCKED_SEGMENTS.some((b) => segs.includes(b.toLowerCase()));
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

  if (hasBlockedSegment(abs)) {
    return err('PATH_BLOCKED', 'Path contains a blocked segment.', {
      blocked: BLOCKED_SEGMENTS,
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
