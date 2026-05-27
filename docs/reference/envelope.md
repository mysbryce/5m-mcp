# Envelope shape

Every tool — without exception — returns the same envelope.

## Success

```json
{
  "ok": true,
  "data": { /* tool-specific payload */ }
}
```

## Failure

```json
{
  "ok": false,
  "error": {
    "code": "STABLE_ENUM",
    "message": "human readable",
    "details": { /* optional, machine-readable */ }
  }
}
```

## Why an envelope and not raw data?

- **One branch.** Every caller writes `if (res.ok) { ... } else { ... }`. No try/catch around tool calls.
- **Stable error codes.** `res.error.code` is an enum the agent can branch on without parsing prose.
- **Room for breadcrumbs.** `details` carries machine-readable context (`{ size, limit }` for `FILE_TOO_LARGE`, `{ issues }` for `INVALID_INPUT`, etc.) without polluting the success shape.

## In the MCP transport

Over `/mcp`, the envelope is wrapped by MCP's `tools/call` response:

```json
{
  "jsonrpc": "2.0",
  "id": "<id>",
  "result": {
    "content": [{ "type": "text", "text": "<envelope serialized as JSON>" }],
    "isError": false
  }
}
```

`isError` mirrors `!envelope.ok`. The text payload deserializes to either the envelope's `data` (when `isError === false`) or `error` (when `isError === true`) — flattened so MCP clients that show the text directly get something useful.

## In direct dispatch

Over `/tools/<name>`, the response body **is** the envelope. No wrapping.
