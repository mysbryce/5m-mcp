# Cursor

Cursor supports MCP via stdio. Use the bundled shim.

## Setup

Open Cursor settings → MCP → "Add new MCP server". Or edit `~/.cursor/mcp.json` directly:

```json
{
  "mcpServers": {
    "agent_api": {
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

Restart Cursor. The agent_api tools appear under MCP servers.

## Notes

- Cursor's MCP support is **tools only** — prompts (the `scaffold-fivem-resource` slash command) won't surface as a UI slash. The grill workflow is still available via the `scaffold_fivem_resource_workflow` tool, which Cursor's agent will auto-call when you express intent to create a new resource.
- Cursor doesn't show MCP server boot logs anywhere obvious. If tools don't appear, try restarting Cursor with the developer console open, or run `npm run smoke:stdio` from the repo to confirm the shim works.
