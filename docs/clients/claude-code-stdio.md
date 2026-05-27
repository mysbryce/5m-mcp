# Claude Code (stdio shim)

If you have a reason to use stdio instead of HTTP — typically because you want every spawn to launch fresh, or you're on an older Claude Code build — use the bundled `dist/mcp-stdio.js` shim.

The shim is a ~100-line bridge: read JSON-RPC from stdin, POST to the resource's `/mcp`, write the response to stdout.

## Setup

```json
{
  "mcpServers": {
    "agent_api": {
      "type": "stdio",
      "command": "node",
      "args": ["C:/path/to/5m-mcp/dist/mcp-stdio.js"],
      "env": {
        "AGENT_API_URL": "http://127.0.0.1:30120/agent_api/mcp",
        "AGENT_API_TOKEN": "PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Use the **absolute path** to `dist/mcp-stdio.js`. Don't try to resolve it from `cwd`.

## When to use stdio

- Your Claude Code build is older than November 2024 and doesn't speak HTTP MCP yet.
- You want process-level isolation per session.
- You're routing through a tool that only wires stdio MCP servers.

Otherwise HTTP is simpler and one fewer process.

## Verify

```sh
npm run smoke:stdio
```

Output:

```
[OK ] initialize → result.serverInfo.name  agent_api
[OK ] initialize → tools capability present
[OK ] tools/list returns array             count=41
[OK ] tools/list includes health
[OK ] tools/call health → isError=false
[OK ] tools/call health → text JSON has status=up
[OK ] tools/call read_file → content includes fx_version
[OK ] tools/call unknown → isError=true
[OK ] unknown method → JSON-RPC error -32601
Result: 9/9 passed
```
