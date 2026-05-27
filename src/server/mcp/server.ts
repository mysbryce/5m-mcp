import { JsonRpcRequest, JsonRpcResponse, RpcErrorCode, rpcError, rpcSuccess } from './jsonrpc';
import { dispatch, listToolDescriptors } from '../tools/registry';
import { ToolContext } from '../tools/context';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'agent_api', version: '0.0.1' };

type ToolCallParams = { name: string; arguments?: unknown };

function isToolCallParams(value: unknown): value is ToolCallParams {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === 'string';
}

export async function handleMcpRequest(
  req: JsonRpcRequest,
  ctx: ToolContext,
): Promise<JsonRpcResponse | null> {
  const id = req.id ?? null;

  // Notifications (no id) — process side-effects, do not reply.
  if (req.id === undefined || req.id === null) {
    if (req.method === 'notifications/initialized') return null;
    if (req.method === 'notifications/cancelled') return null;
    return null;
  }

  switch (req.method) {
    case 'initialize':
      return rpcSuccess(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });

    case 'ping':
      return rpcSuccess(id, {});

    case 'tools/list':
      return rpcSuccess(id, { tools: listToolDescriptors() });

    case 'tools/call': {
      if (!isToolCallParams(req.params)) {
        return rpcError(id, RpcErrorCode.INVALID_PARAMS, 'Missing tool name.');
      }
      const envelope = await dispatch(req.params.name, req.params.arguments ?? {}, ctx);
      return rpcSuccess(id, {
        content: [
          {
            type: 'text',
            text: JSON.stringify(envelope.ok ? envelope.data : envelope.error),
          },
        ],
        isError: !envelope.ok,
      });
    }

    default:
      return rpcError(id, RpcErrorCode.METHOD_NOT_FOUND, `Unknown method: ${req.method}`);
  }
}
