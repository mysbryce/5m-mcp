# Quick start

Five minutes from clone to a running MCP server your agent can call.

## 1. Get the resource into FiveM

Pick one:

::: code-group

```sh [drop-in (release zip)]
# Coming soon — for now, generate the drop-in locally:
git clone https://github.com/mysbryce/5m-mcp.git
cd 5m-mcp
npm install
npm run generate:resource
# → out/agent_api/   (just fxmanifest.lua + dist/*.js + README)
```

```pwsh [symlink the repo (dev)]
git clone https://github.com/mysbryce/5m-mcp.git
cd 5m-mcp
npm install
npm run build
pwsh -File scripts/dev-link.ps1 -ServerRoot <txData base>
```

:::

Either way, the folder ends up at `<server>/resources/[agent]/agent_api/`.

## 2. Start it

In the FiveM server console:

```
refresh
ensure agent_api
```

The first start prints something like:

```
[agent_api] No token configured. Generated new token.
[agent_api] Saved to: dist/.agent_token
[agent_api]
[agent_api] Add this to your Claude Code MCP config:
[agent_api]
[agent_api]   "agent_api": {
[agent_api]     "type": "http",
[agent_api]     "url": "http://127.0.0.1:30120/agent_api/mcp",
[agent_api]     "headers": { "x-agent-token": "7f3a9b..." }
[agent_api]   }
[agent_api]
[agent_api] For lifecycle tools, grant ACE permissions in server.cfg:
[agent_api]
[agent_api]   add_ace resource.agent_api command.ensure  allow
[agent_api]   ... (5 more lines)
[agent_api]
[agent_api] Ready.
```

## 3. Grant ACE rights

Paste those `add_ace` lines into your `server.cfg` and restart the server. Without them `ensure/start/stop/restart/refresh/say` will fail with `Access denied`.

```cfg
add_ace resource.agent_api command.ensure  allow
add_ace resource.agent_api command.start   allow
add_ace resource.agent_api command.stop    allow
add_ace resource.agent_api command.restart allow
add_ace resource.agent_api command.refresh allow
add_ace resource.agent_api command.say     allow
```

## 4. Wire your MCP client

Pick your agent and follow its page:

- [Claude Code (HTTP)](/clients/claude-code) — recommended
- [Codex CLI](/clients/codex) — auto-installer prompt included
- [Cursor](/clients/cursor)
- [Cline, Continue, Zed, others](/clients/others)
- [Custom HTTP client](/clients/custom) — write your own integration

## 5. Smoke-check

From the repo:

```sh
npm run smoke
```

You should see ~24 OK lines. If you see ERR, check the [troubleshooting page](/guide/install#troubleshooting).
