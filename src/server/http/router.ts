import { Envelope, err, ok } from '../util/envelope';
import { HTTP_STATUS } from '../errors/codes';
import { dispatch, listTools } from '../tools/registry';
import { ToolContext } from '../tools/context';
import { audit, hashToken } from '../audit/log';
import { handleMcpRequest } from '../mcp/server';
import { RpcErrorCode, isJsonRpcRequest, rpcError } from '../mcp/jsonrpc';
import { TokenBucket } from '../runtime/rateLimit';
import { handleDashboard } from '../dashboard/router';
import { injectedTexts } from '../dashboard/inject';
import { fullVersion } from '../config/version';

type FivemReq = {
  address: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  setDataHandler: (cb: (data: string) => void) => void;
};

type FivemRes = {
  writeHead: (status: number, headers?: Record<string, string>) => void;
  send: (body?: string) => void;
};

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function readBody(req: FivemReq): Promise<string> {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      resolve('');
      return;
    }
    try {
      req.setDataHandler((data) => resolve(data ?? ''));
    } catch {
      resolve('');
    }
  });
}

function reply(res: FivemRes, status: number, body: unknown): void {
  res.writeHead(status, JSON_HEADERS);
  res.send(JSON.stringify(body));
}

function statusFor(envelope: Envelope<unknown>): number {
  if (envelope.ok) return 200;
  return HTTP_STATUS[envelope.error.code] ?? 500;
}

function lowercaseHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h ?? {})) out[k.toLowerCase()] = v;
  return out;
}

export type RouterDeps = {
  token: string;
  ctx: ToolContext;
  reloadConvars: () => void;
};

export function installHttpRouter(deps: RouterDeps): void {
  const bucket = new TokenBucket(deps.ctx.convars.ratePerMinute);

  function checkRate(token: string): { ok: true } | { ok: false; retryAfterMs: number } {
    const r = bucket.consume(hashToken(token));
    return r.ok ? { ok: true } : { ok: false, retryAfterMs: r.retryAfterMs };
  }

  SetHttpHandler(async (req: FivemReq, res: FivemRes) => {
    try {
      const headers = lowercaseHeaders(req.headers);
      const path = (req.path ?? '/').split('?')[0] ?? '/';

      if (req.method === 'GET' && path === '/health') {
        reply(
          res,
          200,
          ok({ status: 'up', resource: GetCurrentResourceName(), version: fullVersion() }),
        );
        return;
      }

      if (path === '/dashboard' || path.startsWith('/dashboard/')) {
        const body = await readBody(req);
        const dash = await handleDashboard(req.method, path, headers, body, {
          reloadConvars: deps.reloadConvars,
          console: deps.ctx.console,
        });
        res.writeHead(dash.status, dash.headers);
        res.send(dash.body);
        return;
      }

      if (path === '/mcp') {
        if (req.method !== 'POST') {
          reply(res, 405, err('NOT_FOUND', 'MCP endpoint requires POST.'));
          return;
        }

        const supplied = headers['x-agent-token'];
        if (supplied !== deps.token) {
          reply(res, 401, err('UNAUTHORIZED', 'Invalid or missing token.'));
          return;
        }

        const rate = checkRate(supplied);
        if (!rate.ok) {
          reply(
            res,
            429,
            err('RATE_LIMITED', 'Too many requests.', { retryAfterMs: rate.retryAfterMs }),
          );
          return;
        }

        const body = await readBody(req);
        if (body.length > MAX_BODY_BYTES) {
          reply(res, 413, err('BODY_TOO_LARGE', `Body exceeds ${MAX_BODY_BYTES} bytes.`));
          return;
        }

        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(body || 'null');
        } catch {
          reply(res, 400, rpcError(null, RpcErrorCode.PARSE_ERROR, 'Body is not valid JSON.'));
          return;
        }

        if (!isJsonRpcRequest(parsedBody)) {
          reply(
            res,
            400,
            rpcError(null, RpcErrorCode.INVALID_REQUEST, 'Not a JSON-RPC 2.0 request.'),
          );
          return;
        }

        const rpcResp = await handleMcpRequest(parsedBody, deps.ctx);
        audit({
          tool: `mcp:${parsedBody.method}`,
          params:
            parsedBody.method === 'tools/call'
              ? (parsedBody.params ?? null)
              : { method: parsedBody.method },
          result_code: rpcResp && 'error' in rpcResp ? `RPC_${rpcResp.error.code}` : 'OK',
          caller: hashToken(supplied ?? ''),
        });

        if (rpcResp === null) {
          // notification — empty 202 per MCP HTTP transport convention
          res.writeHead(202, JSON_HEADERS);
          res.send('');
          return;
        }
        reply(res, 200, rpcResp);
        return;
      }

      if (req.method === 'GET' && path === '/tools') {
        const supplied = headers['x-agent-token'];
        if (supplied !== deps.token) {
          reply(res, 401, err('UNAUTHORIZED', 'Invalid or missing token.'));
          return;
        }
        reply(
          res,
          200,
          ok({
            tools: listTools().map((t) => ({
              name: t.name,
              description: t.description,
            })),
          }),
        );
        return;
      }

      const toolMatch = path.match(/^\/tools\/([a-z_][a-z0-9_]*)$/i);
      if (!toolMatch || req.method !== 'POST') {
        reply(res, 404, err('NOT_FOUND', `No route for ${req.method} ${path}`));
        return;
      }

      const supplied = headers['x-agent-token'];
      if (supplied !== deps.token) {
        reply(res, 401, err('UNAUTHORIZED', 'Invalid or missing token.'));
        return;
      }

      const rate = checkRate(supplied);
      if (!rate.ok) {
        reply(
          res,
          429,
          err('RATE_LIMITED', 'Too many requests.', { retryAfterMs: rate.retryAfterMs }),
        );
        return;
      }

      const body = await readBody(req);
      if (body.length > MAX_BODY_BYTES) {
        reply(res, 413, err('BODY_TOO_LARGE', `Body exceeds ${MAX_BODY_BYTES} bytes.`));
        return;
      }

      let parsedBody: unknown = {};
      if (body) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          reply(res, 400, err('INVALID_INPUT', 'Body is not valid JSON.'));
          return;
        }
      }

      const toolName = toolMatch[1]!;
      const envelope = await dispatch(toolName, parsedBody, deps.ctx);
      audit({
        tool: toolName,
        params: parsedBody,
        result_code: envelope.ok ? 'OK' : envelope.error.code,
        caller: hashToken(supplied ?? ''),
      });
      const injected = envelope.ok ? injectedTexts(toolName) : [];
      reply(res, statusFor(envelope), injected.length ? { ...envelope, injected } : envelope);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[${GetCurrentResourceName()}] router error:`, message);
      reply(res, 500, err('INTERNAL', message));
    }
  });
}
