import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { Envelope, err, ok } from '../util/envelope';
import { register } from './registry';

const DEFAULT_CDP_URL = 'http://localhost:13172';
const DEFAULT_TIMEOUT = 15_000;
const HARD_TIMEOUT = 60_000;

type Payload = { selector?: string; value?: string; expression?: string };

function script(): string {
  return resolve(GetResourcePath(GetCurrentResourceName()), 'dist', 'nui-interact.js');
}

function runNui(
  action: 'eval' | 'click' | 'fill' | 'get',
  payload: Payload,
  opts: {
    cdpUrl?: string | undefined;
    timeoutMs?: number | undefined;
    targetFilter?: string | undefined;
    resource?: string | undefined;
  },
): Promise<Envelope<unknown>> {
  const file = script();
  if (!existsSync(file)) {
    return Promise.resolve(
      err('INTERNAL', `nui-interact.js missing — run \`npm run build\`. Expected at ${file}`),
    );
  }
  const cdpUrl = opts.cdpUrl ?? DEFAULT_CDP_URL;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
  const filter = opts.targetFilter ?? opts.resource ?? '';

  return new Promise<Envelope<unknown>>((resolveTool) => {
    const nodeBin = GetConvar('agent_api_node_binary', 'node');
    const child = spawn(
      nodeBin,
      [file, action, cdpUrl, String(timeoutMs), filter, JSON.stringify(payload)],
      { cwd: dirname(file), shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
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

    const guard = setTimeout(() => child.kill('SIGTERM'), timeoutMs + 5000);

    child.on('error', (e) => {
      clearTimeout(guard);
      resolveTool(err('INTERNAL', `nui-interact spawn failed: ${e.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(guard);
      const lastLine = stdout.trim().split('\n').pop() ?? '';
      let parsed: { ok: boolean; error?: string; [k: string]: unknown } | null = null;
      try {
        parsed = JSON.parse(lastLine);
      } catch {
        // ignore
      }
      if (!parsed) {
        resolveTool(
          err('INTERNAL', `nui-interact returned no JSON (exit ${code}).`, { stdout, stderr }),
        );
        return;
      }
      if (!parsed.ok) {
        resolveTool(err('INTERNAL', parsed.error ?? 'nui-interact failed', { stderr }));
        return;
      }
      const { ok: _ok, ...rest } = parsed;
      resolveTool(ok(rest));
    });
  });
}

const Common = {
  cdpUrl: z.string().url().optional(),
  timeoutMs: z.number().int().min(1000).max(HARD_TIMEOUT).optional(),
  resource: z.string().optional(),
  targetFilter: z.string().optional(),
};

const EvalInput = z.object({ expression: z.string().min(1), ...Common }).strict();
const ClickInput = z.object({ selector: z.string().min(1), ...Common }).strict();
const FillInput = z.object({ selector: z.string().min(1), value: z.string(), ...Common }).strict();
const GetInput = z.object({ selector: z.string().min(1), ...Common }).strict();

export function registerNuiInteract(): void {
  register({
    name: 'nui_eval',
    description:
      'Run a JS expression in a live FiveM NUI over CDP and return its value (returnByValue). ' +
      "Pass `resource` to target that resource's iframe. The NUI must be open. Use for reading " +
      'arbitrary DOM/app state or driving custom interactions.',
    input: EvalInput,
    handler: async (input: z.infer<typeof EvalInput>) =>
      runNui('eval', { expression: input.expression }, input),
  });

  register({
    name: 'nui_click',
    description:
      'Click a DOM element in the live NUI by CSS selector (over CDP). Pass `resource` to target ' +
      "that resource's iframe. Returns { found } — found:false means the selector matched nothing.",
    input: ClickInput,
    handler: async (input: z.infer<typeof ClickInput>) =>
      runNui('click', { selector: input.selector }, input),
  });

  register({
    name: 'nui_fill',
    description:
      'Set the value of an input/textarea in the live NUI and dispatch input+change events ' +
      "(works with Vue/React controlled inputs). Pass `resource` to target that resource's iframe.",
    input: FillInput,
    handler: async (input: z.infer<typeof FillInput>) =>
      runNui('fill', { selector: input.selector, value: input.value }, input),
  });

  register({
    name: 'nui_get',
    description:
      'Read a DOM element from the live NUI by selector: text, value, bounding rect, and a slice ' +
      "of outerHTML. Pass `resource` to target that resource's iframe. Use to assert UI state.",
    input: GetInput,
    handler: async (input: z.infer<typeof GetInput>) =>
      runNui('get', { selector: input.selector }, input),
  });
}
