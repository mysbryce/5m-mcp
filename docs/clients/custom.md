# Custom client (raw HTTP)

If your stack isn't on the supported list, talking to `agent_api` over raw HTTP is straightforward — it's just JSON-RPC 2.0.

## Endpoints

- `GET /agent_api/health` — unauthenticated liveness probe
- `GET /agent_api/tools` — list tool descriptors (requires `x-agent-token`)
- `POST /agent_api/tools/<name>` — direct tool dispatch (envelope shape)
- `POST /agent_api/mcp` — full MCP JSON-RPC endpoint

Pick `/mcp` if you want spec-compliant MCP; pick `/tools/<name>` if you just want a tool dispatcher and don't need MCP protocol semantics.

## MCP JSON-RPC example (Node 22+)

```ts
const URL = 'http://127.0.0.1:30120/agent_api/mcp';
const TOKEN = process.env.AGENT_API_TOKEN!;

async function rpc(method: string, params?: unknown) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-token': TOKEN,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      ...(params ? { params } : {}),
    }),
  });
  return await res.json();
}

// 1. handshake
await rpc('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'my-client', version: '0.1' },
});

// 2. list tools
const list = await rpc('tools/list');
console.log(list.result.tools.map((t: any) => t.name));

// 3. call a tool
const health = await rpc('tools/call', {
  name: 'health',
  arguments: {},
});
// health.result.content[0].text holds the JSON body as a string
console.log(JSON.parse(health.result.content[0].text));
```

## Direct dispatch example

For environments where you don't want to speak JSON-RPC:

```ts
async function call(name: string, args?: unknown) {
  const res = await fetch(`http://127.0.0.1:30120/agent_api/tools/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-token': TOKEN,
    },
    body: JSON.stringify(args ?? {}),
  });
  return await res.json(); // → { ok: true, data: ... } or { ok: false, error: {...} }
}

const inv = await call('esx_call_player', {
  serverId: 1,
  method: 'getInventory',
});
```

## Response shapes

### Direct dispatch (`/tools/<name>`)

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": { "code": "PATH_OUTSIDE_SANDBOX", "message": "...", "details": { ... } } }
```

See [Envelope shape](/reference/envelope) and [Error codes](/reference/errors).

### MCP (`/mcp`)

```json
{ "jsonrpc": "2.0", "id": "<id>", "result": { ... } }
{ "jsonrpc": "2.0", "id": "<id>", "error": { "code": -32601, "message": "..." } }
```

For `tools/call`, the result contains `{ content: [{ type: "text", text: "<JSON string>" }], isError: <bool> }`. The text payload is the envelope's `data` (when `isError === false`) or the envelope's `error` (when `isError === true`).

## Auth + limits

- `x-agent-token` is mandatory for every call except `GET /health`.
- Body limit: 5 MB.
- Rate limit: 120 requests/minute per token hash (`agent_api_rate_per_minute`).
- Bind: `127.0.0.1` only. Cross-machine access requires SSH tunnelling.
