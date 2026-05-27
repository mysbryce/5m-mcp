# 5m-mcp

> 📖 **Docs site:** <https://mysbryce.github.io/5m-mcp/>
> Source: <https://github.com/mysbryce/5m-mcp>
> License: [PolyForm Noncommercial 1.0.0](./LICENSE) — non-commercial use only, attribution required.

FiveM resource that exposes a safe, local **MCP** (Model Context Protocol) tool surface so an agent can develop, debug, and live-test FiveM resources against a running server.

- Filesystem ops (read / write / scaffold) inside a sandboxed write root
- Resource lifecycle (`ensure`, `start`, `stop`, `restart`, `refresh`) with console capture
- Live player testing via opt-in chat command + client-side probes
- **Dynamic client-native dispatch** — agent can call any FiveM client native on an opted-in player
- Bundled framework bridges: **ESX**, **ox_lib**, **oxmysql** (with reflective method dispatch)
- **Dashboard-taught preferences + custom skills** — teach the agent your structure / coding / ui-design conventions, and upload skills that auto-inject on the tool calls you choose
- HTTP MCP transport (Claude Code talks directly) + stdio shim for other clients

> Single resource. No external sidecar. Drop folder → ensure → ready.

> ℹ️ The project is **5m-mcp**; the FiveM resource you install is named `agent_api` (its convars, routes, and ACE identifiers all use the `agent_api` prefix).

---

## Install

1. **Drop the folder** at `<server-data>/resources/[agent]/agent_api/` (or anywhere FiveM picks it up). Use the packaged drop-in folder from `npm run generate:resource` (output: `out/agent_api/`), or junction the dev repo with `pwsh scripts/dev-link.ps1 -ServerRoot <path>`.

2. **Start it** from the FiveM server console:
   ```
   refresh
   ensure agent_api
   ```

3. **Copy the MCP config** that the resource prints to console on first start:
   ```
   [agent_api] Add this to your Claude Code MCP config:
   [agent_api]
   [agent_api]   "agent_api": {
   [agent_api]     "type": "http",
   [agent_api]     "url": "http://127.0.0.1:30120/agent_api/mcp",
   [agent_api]     "headers": { "x-agent-token": "<generated token>" }
   [agent_api]   }
   ```
   Paste into `~/.claude.json` under `"mcpServers"` (or project `.mcp.json`). Token is auto-generated and persisted to `dist/.agent_token`.

   **Codex CLI** users: see [`docs/install-codex.md`](./docs/install-codex.md) for a copy-paste prompt that installs the MCP server into your Codex config automatically.

   **MCP clients that only speak stdio** (no HTTP transport support) can use the bundled shim at `dist/mcp-stdio.js`:
   ```json
   "agent_api": {
     "type": "stdio",
     "command": "node",
     "args": ["<resource path>/dist/mcp-stdio.js"],
     "env": {
       "AGENT_API_URL": "http://127.0.0.1:30120/agent_api/mcp",
       "AGENT_API_TOKEN": "<generated token>"
     }
   }
   ```
   The shim is a ~100-line stdio↔HTTP bridge; behaviour is identical to the HTTP route.

4. **Grant ACE rights** so lifecycle tools can issue console commands. Add to `server.cfg`:
   ```cfg
   add_ace resource.agent_api command.ensure  allow
   add_ace resource.agent_api command.start   allow
   add_ace resource.agent_api command.stop    allow
   add_ace resource.agent_api command.restart allow
   add_ace resource.agent_api command.refresh allow
   add_ace resource.agent_api command.say     allow
   ```

5. **Verify** from the repo:
   ```sh
   npm run smoke
   ```
   Expects 27 OK lines covering health, read-only ops, lifecycle, MCP transport, and live-player probes.

---

## Configuration (convars)

All convars are read at start-up. Most have safe defaults.

```cfg
# Core
set agent_api_token                       ""                # blank = auto-generate
set agent_api_readonly                    false             # gate every mutating tool
set agent_api_root                        "resources/[agent]"
set agent_api_allow_write_paths           ""                # csv, extra write roots
set agent_api_allow_control_paths         ""                # csv, extra lifecycle roots
set agent_api_console_buffer_lines        2000
set agent_api_max_file_bytes              2097152           # 2 MB
set agent_api_rate_per_minute             120

# Live client testing
set agent_api_test_session_ttl_seconds    1800              # 30 min
set agent_api_test_max_subjects           4
set agent_api_client_blocked_natives      ""                # csv, e.g. "Quit,SetPlayerInvincible"

# Plugins
set agent_api_plugin_esx_enabled          auto              # auto | true | false
set agent_api_plugin_oxlib_enabled        auto
set agent_api_plugin_oxmysql_enabled      auto
set agent_api_plugin_oxmysql_readonly     true              # SELECT only
set agent_api_plugin_oxmysql_allow_statements "SELECT"
set agent_api_plugin_esx_blocked_methods  ""                # csv
set agent_api_plugin_oxlib_blocked_methods ""               # csv
```

---

## Tool catalog

All tools speak the same envelope: `{ ok: true, data: ... }` or `{ ok: false, error: { code, message, details? } }`. Codes are stable enum strings (see `src/server/errors/codes.ts`).

### Core (12)

| Tool                  | What it does                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `health`              | Liveness probe + version + uptime                                         |
| `list_resources`      | Every registered resource with state                                      |
| `get_resource_state`  | One resource's state + path                                               |
| `read_file`           | Read any file in the read sandbox; `offset`/`length` for windowed reads   |
| `write_file`          | Write a file inside a configured write root; `createDirs:true` to mkdir -p |
| `create_resource`     | Scaffold `fxmanifest.lua` + `server.lua` + `README.md`                    |
| `refresh_resources`   | `refresh` + console capture window                                        |
| `ensure_resource`     | `ensure <name>`, wait for state `started`, return logs (refuses self)     |
| `start_resource`      | `start <name>`                                                            |
| `stop_resource`       | `stop <name>`                                                             |
| `restart_resource`    | `restart <name>`                                                          |
| `run_command`         | Allowlisted console command (refresh / players / say / lifecycle verbs)   |
| `tail_console`        | Recent ring-buffer lines, filterable by `since_ts` / `channel`            |

### Navigation & editing (5)

| Tool                  | What it does                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `list_dir`            | List a resource's files/folders; `recursive:true` for the file tree (skips node_modules / dot-dirs) |
| `find_files`          | Glob a resource (`server/**/*.lua`, `**/*.vue`) against the path relative to its root |
| `search_code`         | Grep substring/regex → file/line/text; skips binaries; scope with `path`  |
| `edit_file`           | Surgical str-replace (unique-match guard, `replaceAll`) — cheaper/safer than rewriting; same write gates as `write_file` |
| `wait_for_console`    | Block until a console line matches `pattern` (or timeout) — pairs with `ensure`/`restart` to catch the banner or an error |

### Live player testing (7) + client natives (2)

| Tool                          | What it does                                                          |
| ----------------------------- | --------------------------------------------------------------------- |
| `list_players`                | Opted-in players (TTL countdown + active-subject flag)                |
| `register_test_subject`       | Add opted-in player to active pool (limited by convar)                |
| `unregister_test_subject`     | Remove from active pool                                               |
| `get_player_state`            | Run client probes: entity_basic, ped_status, player_meta, inventory_snap |
| `trigger_client_event`        | Fire any net event at one subject                                     |
| `send_chat`                   | Push a `chat:addMessage` line to one subject                          |
| `wait_for_client_event`       | Block until matching net event (optional `fromSubject` filter)        |
| `client_call_native`          | **Invoke any client native** on a subject. Arg tokens: `$ped`, `$player`, `$serverId`, `$vehicle`, `$lastVehicle`, `$coords`, `$heading`. Readonly verb gate (`Get/Has/Is/Does/Can/Will/Network`) + blocklist. |
| `client_list_natives`         | Enumerate client globals (prefix-filterable) — discovery for `client_call_native` |

### Server natives (2), shell (1), screenshots (2), workflow (1)

| Tool                  | What it does                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `server_call_native`  | Invoke any server-side native by name. Readonly verb gate + built-in danger blocklist (`DropPlayer`, `ExecuteCommand`, `StopResource`, …) + convar blocklist |
| `server_list_natives` | Enumerate server globals (prefix-filterable)                              |
| `run_shell`           | Run an allowlisted binary (`npm`/`npx`/`pnpm`/`yarn`/`bun`/`vite`/`git`/`node`) inside a resource folder. Used by the scaffold workflow to `npm create vite` + build UIs |
| `screenshot_nui`      | Capture the live NUI via CEF CDP at `:13172`. `mode: isolate \| clip \| full` to scope to one resource's iframe |
| `delete_screenshot`   | Remove a screenshot under `dist/screenshots/` (sandboxed)                 |
| `scaffold_fivem_resource_workflow` | **Mandatory pre-flight** for new-resource intent — returns the grill workflow the agent must complete before scaffolding. Also exposed as the MCP prompt `scaffold-fivem-resource` |

### Preferences & custom skills (2)

| Tool                  | What it does                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `list_preferences`    | The user's saved development preferences (structure / coding / ui-design) + the example folder each points at. The grill workflow calls this first; a reminder is auto-injected into `write_file` / `create_resource` / `run_shell` / scaffold results |
| `list_skills`         | User-uploaded custom skills with their trigger tools/categories and markdown body. A matching skill is auto-injected into the result of any tool call it's bound to |

#### Opt-in flow

The player joins the server and types in chat:
```
/agent_test_optin
```
Server prints `[agent_api] opt-in: serverId=...`. Default TTL 30 min. `/agent_test_optout` and disconnect both clear the session immediately.

#### Example: teleport + verify

```jsonc
// 1. get current position
client_call_native { serverId: 1, native: "GetEntityCoords", args: ["$ped", true] }
// → { result: [34.35, -1363.19, 29.37] }

// 2. teleport
client_call_native {
  serverId: 1,
  native: "SetEntityCoords",
  args: ["$ped", 64.35, -1333.19, 29.37, false, false, false, true]
}

// 3. read again, verify
client_call_native { serverId: 1, native: "GetEntityCoords", args: ["$ped", true] }
// → { result: [64.37, -1333.19, 29.35] }
```

### Plugins

`list_plugins` reports which framework bridges loaded. Each plugin auto-detects via `GetResourceState` and skips itself if its target resource is missing.

| Plugin    | Tools                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------- |
| **esx**   | `esx_list_players`, `esx_get_player`, `esx_add_money`, `esx_set_job`, `esx_list_shared_methods`, `esx_list_player_methods`, `esx_call_shared`, `esx_call_player` |
| **oxlib** | `oxlib_notify`, `oxlib_trigger_client_callback`, `oxlib_check_dependency`, `oxlib_list_methods`, `oxlib_call` |
| **oxmysql** | `oxmysql_query`, `oxmysql_scalar`, `oxmysql_execute` (readonly + allow-statements gates)         |

#### Adding a plugin

1. Create `src/server/plugins/<name>/index.ts` exporting a `Plugin`:
   ```ts
   export const myPlugin: Plugin = {
     name: 'myname',
     description: 'one-line',
     detect: () => isResourceStarted('target_resource'),
     install: ({ register, convars }) => {
       register({
         name: 'myname_doit',
         description: '...',
         input: z.object({...}).strict(),
         handler: async (input, ctx) => ok({...}),
       });
     },
   };
   ```
2. Push it into `ALL_PLUGINS` in `src/server/plugins/index.ts`.
3. `npm run build && restart agent_api`. The loader handles detection, opt-out (`agent_api_plugin_<name>_enabled false`), and status logging.

Reflective dispatch helpers — `csvSet`, `isAllowed`, `listCallable`, `safeSerialize` — live in `src/server/plugins/dynamic.ts` for plugins that want generic call surfaces.

---

## Web dashboard

A human control panel is served at:

```
http://127.0.0.1:30120/agent_api/dashboard
```

- First visit with no users → **signup**; the first account becomes the **master**. Signup then closes — the master creates every other account from the Users tab.
- The **Permissions** tab edits the sandbox convars (readonly, write/control roots, rate limit, native blocklists, shell allowlist, plugin gates) **live** — `SetConvar` + a config reload, persisted to `dist/permissions.json`, re-applied at boot. No restart needed.
- The **Preferences** tab (master only) teaches the agent how you like resources built — `structure` / `coding` / `ui-design` items, each with a description and an optional example folder picked through a sandboxed folder browser. Persisted to `dist/preferences.json`; surfaced via `list_preferences` + auto-injection.
- The **Skills** tab (master only) uploads custom markdown skills and binds them to MCP actions by tool name and/or category; the skill body is injected into matching tool results. Persisted to `dist/skills.json` + `dist/skills/<id>.md`.
- Separate from the agent token: dashboard accounts are scrypt-hashed in `dist/users.json`, 12h sessions.

The UI is a Vite + Vue 3 project under `dashboard/`, built to a single committed `dist/dashboard/index.html`. See [`docs/guide/dashboard`](https://mysbryce.github.io/5m-mcp/docs/guide/dashboard).

## UI screenshots (`screenshot_nui`)

`screenshot_nui` attaches to FiveM's running CEF over the Chrome DevTools Protocol at `http://localhost:13172` (raw WebSocket — no Playwright, no headless browser) and captures the live NUI surface. Pass `resource` + `mode: isolate` to hide every other resource's iframe for a clean shot. Saves to `dist/screenshots/`; always follow with `delete_screenshot`.

## Dev

```sh
npm install
npm run watch                  # rebuild dist/*.js on save
npm run typecheck              # tsc --noEmit
npm run lint                   # oxlint
npm run fmt                    # oxfmt (2 space, single quote, semi, lf)
npm run check                  # typecheck + lint + fmt:check
npm run smoke                  # hit every tool against the live server
npm run smoke:stdio            # exercise the stdio shim end-to-end
npm run generate:resource      # build + assemble drop-in folder at out/agent_api/

npm run dashboard:dev          # dashboard UI hot-reload (Vite)
npm run dashboard:build        # → dist/dashboard/index.html (commit the result)
npm run docs:dev               # docs site (Next.js + fumadocs)
npm run docs:deploy            # build + push docs to gh-pages
```

`scripts/dev-link.ps1` creates an NTFS junction from a FiveM server's `resources/[agent]/agent_api` to this repo so `restart agent_api` always picks up the latest `dist/*.js`.

---

## Security notes

- Token rotation: delete `dist/.agent_token`, restart the resource.
- Self-targeting `ensure/start/stop/restart` for `agent_api` itself is hard-refused — the FiveM Mono runtime SIGSEGVs if you tear a script env down while it's serving HTTP. Use the server console instead.
- Path sandbox blocks `.env`, `txData`, `database`, `cache` segments *inside* a resource and refuses `..` / absolute paths. Write requires the resource to live under a configured `agent_api_root` / `agent_api_allow_write_paths`.
- The `oxmysql` plugin defaults to readonly + SELECT only. Open it explicitly via `agent_api_plugin_oxmysql_readonly false` and an expanded `agent_api_plugin_oxmysql_allow_statements` list.
- `agent_api_readonly true` flips a single switch that closes every plugin's mutating verb (write_file is still readable, ESX add_money rejects, dynamic dispatch refuses anything not starting with a read verb, etc.).

---

## Design

See [PLAN.md](./PLAN.md) for the full architecture, milestone breakdown, and threat model.
