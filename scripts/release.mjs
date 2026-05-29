#!/usr/bin/env node
// Cut a GitHub release: build → package resource → zip → tag → push → gh release.
//
//   npm run git:release                 build, package, tag, push, release
//   npm run git:release -- --no-build   reuse the current dist/
//   npm run git:release -- --draft      create the release as a draft
//   npm run git:release -- --dry-run    print every command, run nothing
//   npm run git:release -- --notes path/to/notes.md
//
// Tag + title are derived as v<version>+<hash> from dist/version.json, so the
// release always matches exactly what was built. Notes body comes from
// RELEASE_NOTES.md (repo root) — kept outside out/ because packaging wipes out/.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const argVal = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const dryRun = has('--dry-run');
const skipBuild = has('--no-build');
const draft = has('--draft');
const notesPath = argVal('--notes', join(repoRoot, 'RELEASE_NOTES.md'));

function log(m) {
  console.log(`[release] ${m}`);
}
function fail(m) {
  console.error(`[release] ERROR: ${m}`);
  process.exit(1);
}

/** Run a command, inheriting stdio. Aborts on non-zero (unless --dry-run). */
function run(cmd, cmdArgs) {
  log(`$ ${cmd} ${cmdArgs.join(' ')}`);
  if (dryRun) return 0;
  const r = spawnSync(cmd, cmdArgs, { cwd: repoRoot, stdio: 'inherit', shell: true });
  if (r.status !== 0) fail(`command failed (${r.status}): ${cmd} ${cmdArgs.join(' ')}`);
  return r.status;
}

/** Run a command quietly and return { status, out }. */
function capture(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { cwd: repoRoot, shell: true, encoding: 'utf8' });
  return { status: r.status ?? 1, out: (r.stdout ?? '').trim() };
}

// --- preflight (soft-warn under --dry-run so the plan still prints) ---
function require_(ok, msg) {
  if (ok) return;
  if (dryRun) log(`WARN (ignored in dry-run): ${msg}`);
  else fail(msg);
}
require_(capture('gh', ['--version']).status === 0, 'GitHub CLI (gh) not found on PATH.');
require_(
  capture('gh', ['auth', 'status']).status === 0,
  'gh is not authenticated — run `gh auth login` first.',
);

// --- build + package ---
if (!skipBuild) run('npm', ['run', 'build']);
run('node', ['scripts/generate-resource.mjs', '--no-build']);

// --- derive version + hash ---
const verFile = join(repoRoot, 'dist', 'version.json');
if (!existsSync(verFile)) fail('dist/version.json missing — build first.');
const v = JSON.parse(readFileSync(verFile, 'utf8'));
const tag = `v${v.version}+${v.hash}`;
log(`release tag: ${tag}`);

// --- notes ---
if (!existsSync(notesPath)) fail(`notes file not found: ${notesPath}`);

// --- zip the packaged resource ---
const pkgDir = join(repoRoot, 'out', 'agent_api');
if (!existsSync(pkgDir)) fail('out/agent_api missing — packaging step failed.');
if (process.platform === 'win32') {
  run('powershell', [
    '-NoProfile',
    '-Command',
    "Compress-Archive -Path 'out/agent_api' -DestinationPath 'out/agent_api.zip' -Force",
  ]);
} else {
  run('bash', ['-c', 'cd out && rm -f agent_api.zip && zip -rq agent_api.zip agent_api']);
}
if (!dryRun && existsSync(join(repoRoot, 'out', 'agent_api.zip'))) {
  log(`zip: out/agent_api.zip (${statSync(join(repoRoot, 'out', 'agent_api.zip')).size} bytes)`);
}

// --- tag + push ---
const tagExists = capture('git', ['tag', '--list', `"${tag}"`]).out !== '';
if (!tagExists) run('git', ['tag', '-a', `"${tag}"`, '-m', `"${tag}"`]);
else log(`tag ${tag} already exists — reusing`);
run('git', ['push', 'origin', 'HEAD']);
run('git', ['push', 'origin', `"${tag}"`]);

// --- GitHub release ---
const releaseExists = capture('gh', ['release', 'view', `"${tag}"`]).status === 0;
const zipArg = 'out/agent_api.zip';
const notesArg = `"${notesPath}"`;
if (releaseExists) {
  log(`release ${tag} exists — updating notes + asset`);
  run('gh', ['release', 'edit', `"${tag}"`, '--notes-file', notesArg]);
  run('gh', ['release', 'upload', `"${tag}"`, zipArg, '--clobber']);
} else {
  const createArgs = [
    'release',
    'create',
    `"${tag}"`,
    '--title',
    `"${tag}"`,
    '--notes-file',
    notesArg,
  ];
  if (draft) createArgs.push('--draft');
  createArgs.push(zipArg);
  run('gh', createArgs);
}

log(dryRun ? 'dry run complete — nothing was executed.' : `done — released ${tag}.`);
