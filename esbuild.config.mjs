import { build, context } from 'esbuild';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const dev = watch || process.argv.includes('--dev');

// Hash all build outputs into a short fingerprint so the running server can
// report `version+hash` — letting us tell at a glance whether a rebuild was
// actually deployed (a version bump without a rebuild keeps the old hash).
const HASHED_OUTPUTS = [
  'dist/server.js',
  'dist/client.js',
  'dist/mcp-stdio.js',
  'dist/screenshot-nui.js',
  'dist/nui-interact.js',
  'dist/dashboard/index.html',
];

function writeVersionFile() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const h = createHash('sha256');
  for (const f of HASHED_OUTPUTS.filter((p) => existsSync(p)).sort()) {
    h.update(f);
    h.update(readFileSync(f));
  }
  const hash = h.digest('hex').slice(0, 10);
  writeFileSync(
    'dist/version.json',
    JSON.stringify({ version: pkg.version, hash, builtAt: new Date().toISOString() }, null, 2) +
      '\n',
  );
  console.log(`[esbuild] version ${pkg.version}+${hash}`);
}

/** @type {import("esbuild").BuildOptions} */
const common = {
  bundle: true,
  format: 'cjs',
  target: 'node16',
  platform: 'node',
  logLevel: 'info',
  legalComments: 'none',
  sourcemap: false,
  // NB: identifier minification is intentionally OFF. FiveM's CitizenJS
  // script host re-evaluates the CJS bundle in a way that surfaces esbuild's
  // short-name reuse as "Identifier '_r' has already been declared". Whitespace
  // + syntax minification still shrink the bundle without renaming identifiers.
  minify: false,
  minifyWhitespace: !dev,
  minifySyntax: !dev,
  minifyIdentifiers: false,
  keepNames: false,
};

const targets = [
  {
    ...common,
    entryPoints: ['src/server/index.ts'],
    outfile: 'dist/server.js',
  },
  {
    ...common,
    entryPoints: ['src/client/index.ts'],
    outfile: 'dist/client.js',
  },
  {
    ...common,
    entryPoints: ['src/bin/mcp-stdio.ts'],
    outfile: 'dist/mcp-stdio.js',
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    ...common,
    entryPoints: ['src/bin/screenshot-nui.ts'],
    outfile: 'dist/screenshot-nui.js',
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    ...common,
    entryPoints: ['src/bin/nui-interact.ts'],
    outfile: 'dist/nui-interact.js',
    banner: { js: '#!/usr/bin/env node' },
  },
];

async function run() {
  if (watch) {
    const ctxs = await Promise.all(targets.map((t) => context(t)));
    await Promise.all(ctxs.map((c) => c.watch()));
    console.log('[esbuild] watching...');
  } else {
    await Promise.all(targets.map((t) => build(t)));
    writeVersionFile();
    console.log('[esbuild] build complete');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
