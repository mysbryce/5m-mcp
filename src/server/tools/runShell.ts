import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { register } from './registry';
import { ToolContext } from './context';
import { getResourceInfo } from '../runtime/resources';
import { csvSet } from '../plugins/dynamic';

const DEFAULT_ALLOWLIST = ['npm', 'npx', 'pnpm', 'yarn', 'bun', 'vite', 'git', 'node'];
const MAX_OUTPUT_BYTES = 1_048_576; // 1 MB per stream
const HARD_TIMEOUT_MS = 300_000;

const Input = z
  .object({
    resource: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()).max(64).optional(),
    cwd: z.string().optional(),
    stdin: z.string().max(65_536).optional(),
    timeoutMs: z.number().int().min(500).max(HARD_TIMEOUT_MS).optional(),
    env: z.record(z.string()).optional(),
  })
  .strict();
type Input = z.infer<typeof Input>;

function allowlist(): Set<string> {
  const extra = csvSet('agent_api_shell_allowed_commands');
  if (extra.size === 0) return new Set(DEFAULT_ALLOWLIST);
  return extra;
}

function resolveCwd(
  resourceRoot: string,
  sub?: string,
): { ok: true; path: string } | { ok: false; reason: string } {
  if (!sub) return { ok: true, path: resourceRoot };
  if (
    sub.includes('..') ||
    sub.startsWith('/') ||
    sub.startsWith('\\') ||
    /^[a-z]:[\\/]/i.test(sub)
  ) {
    return { ok: false, reason: 'cwd must be a relative subpath of the resource root.' };
  }
  const abs = resolve(resourceRoot, sub);
  const root = resolve(resourceRoot);
  if (!abs.startsWith(root)) {
    return { ok: false, reason: 'cwd escapes the resource root.' };
  }
  return { ok: true, path: abs };
}

export function registerRunShell(): void {
  register({
    name: 'run_shell',
    description:
      'Run an allowlisted shell binary (default: npm, npx, pnpm, yarn, bun, vite, git, node) ' +
      'inside a resource folder. Use for `npm install`, `npx vite create`, `pnpm build`, etc. ' +
      'cwd is always anchored to the target resource root; relative subpaths are allowed. ' +
      'Override allowlist via convar agent_api_shell_allowed_commands (csv). ' +
      'Requires agent_api_readonly=false. Output is captured up to 1MB per stream.',
    input: Input,
    handler: async (input: Input, ctx: ToolContext): Promise<Envelope<unknown>> => {
      if (ctx.convars.readonly) {
        return err('COMMAND_NOT_ALLOWED', 'Server is in read-only mode.');
      }
      const allowed = allowlist();
      if (!allowed.has(input.command)) {
        return err('COMMAND_NOT_ALLOWED', `Shell command not in allowlist: ${input.command}`, {
          allowed: [...allowed],
        });
      }

      const info = getResourceInfo(input.resource);
      if (!info) {
        return err('RESOURCE_NOT_FOUND', `Resource not found: ${input.resource}`);
      }

      const cwd = resolveCwd(info.path, input.cwd);
      if (!cwd.ok) {
        return err('PATH_OUTSIDE_SANDBOX', cwd.reason);
      }

      const timeoutMs = input.timeoutMs ?? 30_000;
      const args = input.args ?? [];

      // On Windows the allowlisted tools (npm/npx/pnpm/yarn/vite) are .cmd shims
      // that Node refuses to spawn without a shell. Enable shell there, but reject
      // shell metacharacters in args so the shell can't be used for injection.
      const useShell = process.platform === 'win32';
      if (useShell) {
        const bad = args.find((a) => /[&|<>^\r\n]/.test(a));
        if (bad !== undefined) {
          return err(
            'COMMAND_NOT_ALLOWED',
            `Argument contains a shell metacharacter (refused on Windows): ${bad}`,
          );
        }
      }

      return new Promise<Envelope<unknown>>((resolveTool) => {
        const child = spawn(input.command, args, {
          cwd: cwd.path,
          env: { ...process.env, ...input.env },
          shell: useShell,
          windowsHide: true,
        });

        let stdout = '';
        let stderr = '';
        let stdoutCapped = false;
        let stderrCapped = false;
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 1000).unref();
        }, timeoutMs);

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');

        child.stdout.on('data', (chunk: string) => {
          if (stdoutCapped) return;
          if (stdout.length + chunk.length > MAX_OUTPUT_BYTES) {
            stdout += chunk.slice(0, MAX_OUTPUT_BYTES - stdout.length);
            stdoutCapped = true;
          } else {
            stdout += chunk;
          }
        });
        child.stderr.on('data', (chunk: string) => {
          if (stderrCapped) return;
          if (stderr.length + chunk.length > MAX_OUTPUT_BYTES) {
            stderr += chunk.slice(0, MAX_OUTPUT_BYTES - stderr.length);
            stderrCapped = true;
          } else {
            stderr += chunk;
          }
        });

        child.on('error', (e) => {
          clearTimeout(timer);
          resolveTool(err('INTERNAL', `spawn failed: ${e.message}`));
        });

        child.on('close', (code, signal) => {
          clearTimeout(timer);
          if (timedOut) {
            resolveTool(
              err('TIMEOUT', `${input.command} timed out after ${timeoutMs}ms.`, {
                signal,
                stdout,
                stderr,
                stdoutCapped,
                stderrCapped,
              }),
            );
            return;
          }
          resolveTool(
            ok({
              command: input.command,
              args,
              cwd: cwd.path,
              exitCode: code,
              signal,
              durationMs: Date.now() - startedAt,
              stdout,
              stderr,
              stdoutCapped,
              stderrCapped,
            }),
          );
        });

        const startedAt = Date.now();

        if (input.stdin !== undefined) {
          child.stdin.write(input.stdin);
        }
        child.stdin.end();
      });
    },
  });
}
