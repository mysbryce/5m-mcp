import { spawn } from 'node:child_process';
import { existsSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { register } from './registry';

const DEFAULT_CDP_URL = 'http://localhost:13172';
const DEFAULT_TIMEOUT = 15_000;
const HARD_TIMEOUT = 60_000;

function screenshotDir(): string {
  return resolve(GetResourcePath(GetCurrentResourceName()), 'dist', 'screenshots');
}

function screenshotScript(): string {
  return resolve(GetResourcePath(GetCurrentResourceName()), 'dist', 'screenshot-nui.js');
}

function defaultOutputPath(): string {
  const stamp = new Date()
    .toISOString()
    .replaceAll(/[-:.TZ]/g, '')
    .slice(0, 14);
  return join(screenshotDir(), `nui-${stamp}-${Math.floor(Math.random() * 1e6)}.png`);
}

const CaptureInput = z
  .object({
    outputPath: z.string().optional(),
    cdpUrl: z.string().url().optional(),
    timeoutMs: z.number().int().min(1000).max(HARD_TIMEOUT).optional(),
    targetFilter: z.string().optional(),
    resource: z.string().optional(),
    mode: z.enum(['isolate', 'clip', 'full']).optional(),
  })
  .strict();
type CaptureInput = z.infer<typeof CaptureInput>;

export function registerScreenshotNui(): void {
  register({
    name: 'screenshot_nui',
    description:
      'Capture the actual FiveM NUI render via CDP at http://localhost:13172 — NOT the DevTools UI. ' +
      'Pass `resource` to scope the screenshot to one resource. `mode` controls how: ' +
      '"isolate" (default) hides every other resource iframe temporarily for a clean shot then restores them; ' +
      '"clip" leaves siblings visible and just crops the PNG to the iframe rect; ' +
      '"full" captures the whole root overlay (siblings included). ' +
      'Workflow: 1) ensure player opted in and opened the UI, 2) call this tool with ' +
      '`{ resource: "<your_resource>" }`, 3) Read the returned PNG path, 4) delete_screenshot. ' +
      'No browser install needed — connects to the running CEF over CDP.',
    input: CaptureInput,
    handler: async (input: CaptureInput): Promise<Envelope<unknown>> => {
      const script = screenshotScript();
      if (!existsSync(script)) {
        return err(
          'INTERNAL',
          `screenshot-nui.js missing — run \`npm run build\`. Expected at ${script}`,
        );
      }
      const outputPath = input.outputPath ? resolve(input.outputPath) : defaultOutputPath();
      const cdpUrl = input.cdpUrl ?? DEFAULT_CDP_URL;
      const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT;

      return new Promise<Envelope<unknown>>((resolveTool) => {
        const nodeBin = GetConvar('agent_api_node_binary', 'node');
        const child = spawn(
          nodeBin,
          [
            script,
            outputPath,
            cdpUrl,
            String(timeoutMs),
            input.targetFilter ?? '',
            input.resource ?? '',
            input.mode ?? (input.resource ? 'isolate' : 'full'),
          ],
          {
            cwd: dirname(script),
            shell: false,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );

        let stdout = '';
        let stderr = '';
        child.stdout?.setEncoding('utf8');
        child.stderr?.setEncoding('utf8');
        child.stdout?.on('data', (c) => {
          stdout += c;
        });
        child.stderr?.on('data', (c) => {
          stderr += c;
        });

        const guard = setTimeout(() => {
          child.kill('SIGTERM');
        }, timeoutMs + 5000);

        child.on('error', (e) => {
          clearTimeout(guard);
          resolveTool(err('INTERNAL', `screenshot spawn failed: ${e.message}`));
        });

        child.on('close', (code) => {
          clearTimeout(guard);
          const lastLine = stdout.trim().split('\n').pop() ?? '';
          let parsed: {
            ok: boolean;
            path?: string;
            bytes?: number;
            error?: string;
            target?: { url: string; title: string; id?: string };
            candidates?: Array<{ url: string; title: string }>;
            iframe?: { name?: string; found?: boolean; rect?: unknown };
          } | null = null;
          try {
            parsed = JSON.parse(lastLine);
          } catch {
            // ignore
          }
          if (!parsed) {
            resolveTool(
              err('INTERNAL', `screenshot script returned no JSON (exit ${code}).`, {
                stdout,
                stderr,
              }),
            );
            return;
          }
          if (!parsed.ok) {
            resolveTool(
              err('INTERNAL', parsed.error ?? 'screenshot failed', {
                stderr,
                iframe: parsed.iframe,
              }),
            );
            return;
          }
          const stat = existsSync(parsed.path!) ? statSync(parsed.path!) : null;
          resolveTool(
            ok({
              path: parsed.path,
              bytes: parsed.bytes ?? stat?.size ?? 0,
              target: parsed.target,
              candidates: parsed.candidates,
              iframe: parsed.iframe,
              hint: 'Use the Read tool with `file_path` set to the returned `path` to view the PNG, then call delete_screenshot to clean up.',
            }),
          );
        });
      });
    },
  });

  register({
    name: 'delete_screenshot',
    description:
      'Remove a screenshot previously written by screenshot_nui. Only paths inside the agent_api ' +
      'dist/screenshots directory are accepted. Call this after viewing the file with the Read tool.',
    input: z.object({ path: z.string().min(1) }).strict(),
    handler: async (input: { path: string }) => {
      const abs = resolve(input.path);
      const dir = screenshotDir();
      if (!abs.startsWith(dir)) {
        return err('PATH_OUTSIDE_SANDBOX', `Can only delete files inside ${dir}.`);
      }
      if (!existsSync(abs)) {
        return ok({ deleted: false, path: abs, reason: 'not found' });
      }
      try {
        unlinkSync(abs);
        return ok({ deleted: true, path: abs });
      } catch (e) {
        return err('INTERNAL', `delete failed: ${(e as Error).message}`);
      }
    },
  });
}
