# 5m-mcp

A single FiveM resource that exposes a safe **MCP** (Model Context Protocol) surface, so any
MCP-aware agent — Claude Code, Codex, Cursor — can **build, debug, and live-test FiveM resources
against a running server**.

> The project is **5m-mcp**; the resource you install is named `agent_api`.

---

## Flagship abilities

- **One agent, one URL.** Talks real MCP over HTTP (or a stdio shim). No external sidecar — drop the folder, `ensure`, paste the printed config into your client.
- **Full dev loop on a live server.** Read / write / surgical-edit / multi-edit files in a sandbox, scaffold resources, `ensure`/`restart` with console capture, then `wait_for_console` + `scan_errors` to catch failures and fix them — without leaving chat.
- **Navigate any resource.** Recursive file tree, glob, and substring/regex code search (build output skipped by default).
- **Live in-game testing.** Opt-in players, invoke **any** client/server native by name, and drive the NUI over CDP — screenshot, click, fill, and eval, reaching even cross-origin resource iframes.
- **Framework-aware.** Bundled **ESX / ox_lib / oxmysql** bridges (reflective method calls, DB schema introspection, gated migrations) plus calling **any** resource's exports.
- **Teach it your way.** A web dashboard where you set **Preferences** (mirror your structure / coding / UI conventions) and upload **Skills** that auto-inject into the tool calls you choose.
- **Guided workflows.** MCP prompts for the hard parts: scaffold (grill Q&A), `debug-resource`, `add-db-table`, and a `security-review` cheat-prevention audit.
- **Monitor + audit.** Realtime, colorized console and a full audit trail of every agent action — live in the dashboard.
- **Safe by default.** Auto-generated token, read-only kill-switch, path sandbox, ACE-aware lifecycle, native/SQL blocklists, per-resource locks, and a JSONL audit log of every call.

---

## Install

1. Drop the folder at `resources/[agent]/agent_api/` (or `npm run generate:resource`).
2. In the server console: `refresh` → `ensure agent_api`.
3. Copy the MCP config the resource prints on first start into your client.

---

- **Docs:** <https://mysbryce.github.io/5m-mcp/> 
- **Source:** <https://github.com/mysbryce/5m-mcp>
- **License:** [PolyForm Noncommercial 1.0.0](./LICENSE) — non-commercial use, attribution required.

Full setup, the complete tool catalog, convars, dashboard, and security model live in the
**[docs](https://mysbryce.github.io/5m-mcp/)**.
