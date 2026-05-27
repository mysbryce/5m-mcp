import { JsonRpcRequest, JsonRpcResponse, RpcErrorCode, rpcError, rpcSuccess } from './jsonrpc';
import { dispatch, listToolDescriptors } from '../tools/registry';
import { ToolContext } from '../tools/context';
import { getPrompt, listPrompts } from './prompts';
import { listResources, readResource } from './resources';
import { injectedTexts } from '../dashboard/inject';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'agent_api', version: '0.4.0' };

type ToolCallParams = { name: string; arguments?: unknown };

function isToolCallParams(value: unknown): value is ToolCallParams {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === 'string';
}

type PromptGetParams = { name: string; arguments?: Record<string, string> };

function isPromptGetParams(value: unknown): value is PromptGetParams {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === 'string';
}

export async function handleMcpRequest(
  req: JsonRpcRequest,
  ctx: ToolContext,
): Promise<JsonRpcResponse | null> {
  const id = req.id ?? null;

  if (req.id === undefined || req.id === null) {
    if (req.method === 'notifications/initialized') return null;
    if (req.method === 'notifications/cancelled') return null;
    return null;
  }

  switch (req.method) {
    case 'initialize':
      return rpcSuccess(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          prompts: { listChanged: false },
          resources: { listChanged: false },
        },
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
      const content: Array<{ type: 'text'; text: string }> = [
        {
          type: 'text',
          text: JSON.stringify(envelope.ok ? envelope.data : envelope.error),
        },
      ];
      if (envelope.ok) {
        for (const text of injectedTexts(req.params.name)) content.push({ type: 'text', text });
      }
      return rpcSuccess(id, { content, isError: !envelope.ok });
    }

    case 'resources/list':
      return rpcSuccess(id, { resources: listResources() });

    case 'resources/read': {
      const params = req.params as { uri?: unknown } | undefined;
      const uri = params && typeof params.uri === 'string' ? params.uri : null;
      if (!uri) {
        return rpcError(id, RpcErrorCode.INVALID_PARAMS, 'Missing resource uri.');
      }
      const resource = await readResource(uri);
      if (!resource) {
        return rpcError(id, RpcErrorCode.INVALID_PARAMS, `Unknown resource: ${uri}`);
      }
      return rpcSuccess(id, {
        contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: resource.text }],
      });
    }

    case 'prompts/list':
      return rpcSuccess(id, { prompts: listPrompts() });

    case 'prompts/get': {
      if (!isPromptGetParams(req.params)) {
        return rpcError(id, RpcErrorCode.INVALID_PARAMS, 'Missing prompt name.');
      }
      const prompt = getPrompt(req.params.name);
      if (!prompt) {
        return rpcError(id, RpcErrorCode.INVALID_PARAMS, `Unknown prompt: ${req.params.name}`);
      }
      return rpcSuccess(id, {
        description: prompt.description,
        messages: prompt.build(req.params.arguments ?? {}),
      });
    }

    default:
      return rpcError(id, RpcErrorCode.METHOD_NOT_FOUND, `Unknown method: ${req.method}`);
  }
}
