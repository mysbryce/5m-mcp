import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');
const dev = watch || process.argv.includes('--dev');

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
];

async function run() {
  if (watch) {
    const ctxs = await Promise.all(targets.map((t) => context(t)));
    await Promise.all(ctxs.map((c) => c.watch()));
    console.log('[esbuild] watching...');
  } else {
    await Promise.all(targets.map((t) => build(t)));
    console.log('[esbuild] build complete');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
