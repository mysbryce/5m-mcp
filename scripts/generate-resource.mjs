#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const args = process.argv.slice(2);
const skipBuild = args.includes('--no-build');
const outDir = (() => {
  const i = args.indexOf('--out');
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return join(repoRoot, 'out', 'agent_api');
})();

function log(msg) {
  console.log(`[generate] ${msg}`);
}

function fail(msg) {
  console.error(`[generate] ERROR: ${msg}`);
  process.exit(1);
}

if (!skipBuild) {
  log('building...');
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) fail('build failed');
}

const requiredDist = ['server.js', 'client.js', 'mcp-stdio.js'];
for (const name of requiredDist) {
  const p = join(repoRoot, 'dist', name);
  if (!existsSync(p)) fail(`missing dist/${name} (build first)`);
}

if (existsSync(outDir)) {
  log(`cleaning ${outDir}`);
  rmSync(outDir, { recursive: true, force: true });
}
mkdirSync(join(outDir, 'dist'), { recursive: true });

const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const version = pkg.version ?? '0.0.0';

// fxmanifest.lua — straight copy
copyFileSync(join(repoRoot, 'fxmanifest.lua'), join(outDir, 'fxmanifest.lua'));
log('copied fxmanifest.lua');

// dist bundles
for (const name of requiredDist) {
  copyFileSync(join(repoRoot, 'dist', name), join(outDir, 'dist', name));
  log(`copied dist/${name}`);
}

// minimal README
const readme = `# agent_api v${version}

Drop this folder into a FiveM server at \`resources/[agent]/agent_api\` and run:

    refresh
    ensure agent_api

On first start the resource generates a token, persists it to \`dist/.agent_token\`,
and prints a copy-paste Claude Code MCP config block to the server console.

See PLAN.md in the source repo for the full design.
`;
writeFileSync(join(outDir, 'README.md'), readme, 'utf8');
log('wrote README.md');

log('');
log(`done — packaged resource at: ${outDir}`);
log(`drop this folder into <server>/resources/[agent]/`);
