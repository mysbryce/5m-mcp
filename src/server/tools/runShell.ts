import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { register } from './registry';
import { ToolContext } from './context';
import { getResourceInfo } from '../runtime/resources';
import { csvSet } from '../plugins/dynamic';

// `rtk` (Rust Token Killer) ships bundled with this resource under bin/.
const DEFAULT_ALLOWLIST = ['npm', 'npx', 'pnpm', 'yarn', 'bun', 'vite', 'git', 'node', 'rtk'];
// Keep the head and tail of each stream and drop the middle. Build logs are
// usually only interesting at the start (what ran) and end (the error/summary);
// the bulk in the middle floods the agent's context for no benefit.
const OUTPUT_HEAD_BYTES = 32_768;
const OUTPUT_TAIL_BYTES = 32_768;
const HARD_TIMEOUT_MS = 300_000;

/** Captures a stream keeping only its head + tail, marking when bytes were dropped. */
class StreamCapture {
  private head = '';
  private tail = '';
  private total = 0;

  push(chunk: string): void {
    this.total += chunk.length;
    if (this.head.length < OUTPUT_HEAD_BYTES) {
      const room = OUTPUT_HEAD_BYTES - this.head.length;
      this.head += chunk.slice(0, room);
      const rest = chunk.slice(room);
      if (rest) this.appendTail(rest);
    } else {
      this.appendTail(chunk);
    }
  }

  private appendTail(s: string): void {
    this.tail += s;
    if (this.tail.length > OUTPUT_TAIL_BYTES) {
      this.tail = this.tail.slice(this.tail.length - OUTPUT_TAIL_BYTES);
    }
  }

  get capped(): boolean {
    return this.total > this.head.length + this.tail.length;
  }

  get bytes(): number {
    return this.total;
  }

  result(): string {
    if (!this.capped) return this.head + this.tail;
    const omitted = this.total - this.head.length - this.tail.length;
    return `${this.head}\n...[${omitted} bytes omitted]...\n${this.tail}`;
  }
}

// Binaries we ship inside the resource. Resolved to an absolute path so they
// run regardless of the FiveM server process PATH (e.g. ~/.cargo/bin missing).
const BUNDLED_BINARIES: Record<string, string> = {
  rtk: process.platform === 'win32' ? 'bin/rtk.exe' : 'bin/rtk',
};

/** Map an allowlisted command to its bundled absolute path, else leave it for PATH lookup. */
function resolveBinary(command: string): string {
  const rel = BUNDLED_BINARIES[command];
  if (!rel) return command;
  const abs = join(GetResourcePath(GetCurrentResourceName()), rel);
  return existsSync(abs) ? abs : command;
}

const Input = z
  .object({
    resource: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()).max(64).optional(),
    cwd: z.string().optional(),
    stdin: z.string().max(65_536).optional(),
    timeoutMs: z.number().int().min(500).max(HARD_TIMEOUT_MS).optional(),
    env: z.record(z.string()).optional(),
    // Run the command through the bundled `rtk` (Rust Token Killer) proxy so its
    // output is token-compressed (e.g. `git`/`npm` logs). Equivalent to `rtk <command> <args>`.
    useRtk: z.boolean().optional(),
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
      'Run an allowlisted shell binary (default: npm, npx, pnpm, yarn, bun, vite, git, node, rtk) ' +
      'inside a resource folder. Use for `npm install`, `npx vite create`, `pnpm build`, `rtk git status`, etc. ' +
      'rtk (Rust Token Killer) is bundled in bin/ and runs without a PATH entry. ' +
      'Set useRtk=true to wrap any command as `rtk <command> <args>` for 60-90% token-compressed output. ' +
      'cwd is always anchored to the target resource root; relative subpaths are allowed. ' +
      'Override allowlist via convar agent_api_shell_allowed_commands (csv). ' +
      'Requires agent_api_readonly=false. Output keeps the first + last 32KB per stream; the middle is dropped with a byte-count marker.',
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

      // useRtk wraps the command as `rtk <command> <args>` so rtk compresses the
      // output. Skip if the command is already rtk (avoid `rtk rtk ...`).
      const viaRtk = input.useRtk === true && input.command !== 'rtk';
      const effCommand = viaRtk ? 'rtk' : input.command;
      const effArgs = viaRtk ? [input.command, ...args] : args;

      const binary = resolveBinary(effCommand);
      // With shell:true (Windows), an absolute path may contain spaces/brackets
      // (e.g. resources/[development]/...). Quote it so the shell treats it as one token.
      const spawnCmd = useShell && binary !== effCommand ? `"${binary}"` : binary;

      return new Promise<Envelope<unknown>>((resolveTool) => {
        const child = spawn(spawnCmd, effArgs, {
          cwd: cwd.path,
          env: { ...process.env, ...input.env },
          shell: useShell,
          windowsHide: true,
        });

        const outCap = new StreamCapture();
        const errCap = new StreamCapture();
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 1000).unref();
        }, timeoutMs);

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');

        child.stdout.on('data', (chunk: string) => outCap.push(chunk));
        child.stderr.on('data', (chunk: string) => errCap.push(chunk));

        child.on('error', (e) => {
          clearTimeout(timer);
          resolveTool(err('INTERNAL', `spawn failed: ${e.message}`));
        });

        child.on('close', (code, signal) => {
          clearTimeout(timer);
          const stdout = outCap.result();
          const stderr = errCap.result();
          const stdoutCapped = outCap.capped;
          const stderrCapped = errCap.capped;
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
              viaRtk,
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
