import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Compiled fallback, used only if dist/version.json is missing (e.g. running
// an un-fingerprinted build). The real version + build hash come from the file
// esbuild writes at build time, so a stale bundle reports its own old hash.
const FALLBACK_VERSION = '0.7.0';

let cached: string | null = null;

export function fullVersion(): string {
  if (cached) return cached;
  try {
    const p = join(GetResourcePath(GetCurrentResourceName()), 'dist', 'version.json');
    if (existsSync(p)) {
      const v = JSON.parse(readFileSync(p, 'utf8')) as { version?: string; hash?: string };
      const version = v.version ?? FALLBACK_VERSION;
      cached = v.hash ? `${version}+${v.hash}` : version;
      return cached;
    }
  } catch {
    // fall through to fallback
  }
  cached = FALLBACK_VERSION;
  return cached;
}
