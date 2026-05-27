# PLAN.md

## Goal

Build a FiveM server resource that exposes safe local APIs for agentic resource development.

Agent can:

- Read resource files (any resource, read-only outside sandbox)
- Write resource files (only inside sandbox roots)
- Create new resources (only inside sandbox roots)
- Refresh resource list
- Ensure/start/restart/stop resources (only sandbox resources by default)
- Capture console logs around commands
- Report resource state after actions

## Sandbox Scope

Write access is restricted by convar allowlist.

- Default write root: `resources/[agent]/`
- Additional write roots: opt-in via `agent_api_allow_write_paths` (comma-separated, relative to server data dir)
- Read access: any resource folder, but blocked paths (`.env`, `txData/`, `database/`, `cache/`, `..`) always rejected
- Lifecycle commands (`ensure/start/stop/restart`): default allow only resources whose folder lives inside a write root; explicit opt-in convar `agent_api_allow_control_paths` to extend

Rationale: live server. Start narrow. Widening allowlist later is cheap; recovering from a wiped resource is not.

## Architecture

```text
MCP Client (Claude Code)
  -> [optional] bin/mcp-stdio.js  (stdio <-> HTTP bridge, ~100 LOC)
  -> http://127.0.0.1:30120/agent_api/mcp   (canonical surface)
       - HTTP/MCP transport via SetHttpHandler
       - FiveM natives
       - console listener
       - filesystem ops
```

Single resource. No external sidecar.

Transport:

- **Canonical:** HTTP MCP (Streamable HTTP / SSE) — Claude config: `{ "type": "http", "url": "http://127.0.0.1:30120/agent_api/mcp", "headers": { "x-agent-token": "..." } }`
- **Optional shim:** `bin/mcp-stdio.js` — for MCP clients that only speak stdio. Spawned by client, forwards every JSON-RPC frame over HTTP to the resource. Built from `src/bin/mcp-stdio.ts`.
  - Config via env vars: `AGENT_API_URL` (default `http://127.0.0.1:30120/agent_api/mcp`) and `AGENT_API_TOKEN` (required).
  - Exits non-zero with a clear stderr message if token is missing.

## Implementation Stack

- Language: **TypeScript** (strict)
- Runtime: FiveM `server_script` + `client_script` (CitizenJS / Node-like)
- Types: `@citizenfx/server` + `@citizenfx/client`
- Build: **esbuild** → bundled `dist/server.js`, `dist/client.js`, `dist/mcp-stdio.js`
- Validation: **zod** (schema + runtime check + type inference + JSON Schema gen via `zod-to-json-schema`)

### Build & install

- `dist/` is **committed** to the repo. Zero-build install for end users.
- `.gitattributes`: `dist/*.js linguist-generated=true` so GitHub does not count it as source.
- Releases are cut manually (no CI). Tag a commit, that is the release.
- fxmanifest points at `dist/server.js` and `dist/client.js`.

`package.json` scripts:

```json
{
  "scripts": {
    "build": "node esbuild.config.mjs",
    "watch": "node esbuild.config.mjs --watch",
    "typecheck": "tsc --noEmit"
  }
}
```

Dev loop: `npm run watch` rebuilds on save → `restart agent_api` in console.
- Lint/format: TBD

## Repo Layout (resource root)

```text
agent_api/
  fxmanifest.lua
  package.json
  tsconfig.json
  esbuild.config.mjs
  src/
    server/
      index.ts                 # entry, wires everything
      http/
        router.ts              # SetHttpHandler dispatcher
        middleware/
          auth.ts              # token check
          bodyLimit.ts
          audit.ts
        routes/
          health.ts
          resources.ts
          files.ts
          logs.ts
          command.ts
          players.ts           # client-testing MCP tools
      fs/
        sandbox.ts             # path validation, allowlist
        read.ts
        write.ts
        create.ts
      runtime/
        natives.ts             # typed wrappers around Cfx natives
        state.ts               # resource state queries
        command.ts             # ExecuteCommand wrapper + allowlist
      console/
        listener.ts            # RegisterConsoleListener
        ringBuffer.ts          # bounded log buffer
      players/
        registry.ts            # opt-in sessions (license+serverId+ttl)
        subjects.ts             # active test-subject pool
        events.ts              # net events from client probes
      config/
        convars.ts             # load + validate convars
      audit/
        log.ts                 # append-only action log
      schemas/                 # request/response shapes (zod)
      errors/
        types.ts               # structured error codes
      util/
        result.ts              # Result<T,E> helpers
    client/
      index.ts                 # client entry, registers probe handlers
      probes/
        entity.ts              # coords, ped, vehicle
        player.ts              # health, armor, model
        inventory.ts           # opt: bridge to other inv resources
      events.ts                # client-side net event router
      optin.ts                 # /agent_test_optin chat command
    bin/
      mcp-stdio.ts             # stdio<->HTTP shim entry
  dist/
    server.js                  # esbuild output (committed? TBD)
    mcp-stdio.js               # esbuild output for the shim
```

Folder boundaries = stable surface. Add new tool = new file under `routes/` + handler under `fs/` or `runtime/`. No file should know more than one concern.

## Resource API

Base URL:

```text
http://127.0.0.1:30120/agent_api
```

Required header:

```text
x-agent-token: <secret>
```

Endpoints:

```text
GET  /health
GET  /resources
GET  /resource/:name/state
POST /resource/:name/ensure
POST /resource/:name/start
POST /resource/:name/stop
POST /resource/:name/restart

GET  /file?resource=name&path=server.lua
POST /file
POST /resource/create

GET  /logs
POST /command
```

## MCP Tool Surface

19 flat tools. 1:1 mapping to HTTP endpoints. snake_case names.

Resource & file ops (12):

```text
list_resources           # enumerate all registered resources
get_resource_state       # state of one resource
read_file                # read file from any resource (read sandbox)
write_file               # write file (write sandbox only)
create_resource          # scaffold new resource (write sandbox only)
ensure_resource          # ExecuteCommand("ensure ...") + state + logs
start_resource
stop_resource
restart_resource
refresh_resources        # ExecuteCommand("refresh")
tail_console             # recent console ring buffer
run_command              # allowlisted commands only
```

Live client testing (7):

```text
list_players                 # only opted-in players
register_test_subject        # add opted-in player to active subject pool
unregister_test_subject
get_player_state             # via client probes (coords/ped/vehicle/health)
trigger_client_event         # fire arbitrary net event at one subject
send_chat                    # server-side chat to one subject
wait_for_client_event        # block until matching net event received
```

Each tool = one route file under `src/server/http/routes/` + one handler under `fs/` or `runtime/`. Add composite tools (e.g. `patch_and_reload`) later only if a chain becomes a recurring agent pattern.

## Response Envelope

Every tool returns the same shape.

Success:

```json
{ "ok": true, "data": { ... } }
```

Failure:

```json
{
  "ok": false,
  "error": {
    "code": "PATH_OUTSIDE_SANDBOX",
    "message": "human-readable summary",
    "details": { ... }
  }
}
```

`code` is a stable enum. Agent can branch on it without parsing prose.

Error codes (initial set, append-only):

```text
UNAUTHORIZED                 # token missing or wrong
INVALID_INPUT                # zod validation failed
RESOURCE_NOT_FOUND
PATH_OUTSIDE_SANDBOX
PATH_BLOCKED                 # blocked path (.env, txData/, etc.)
EXTENSION_NOT_ALLOWED
FILE_TOO_LARGE
COMMAND_NOT_ALLOWED
RESOURCE_FAILED_TO_START     # ensure ran but state != started
INTERNAL                     # uncaught / fallback
```

Lives in `src/server/errors/types.ts` as a const enum + helper `err(code, message, details?)`.

## Core Tools

### read_file

Read file from known resource.

Uses:

```lua
LoadResourceFile(resource, path)
```

Reject:

- `..`
- absolute paths
- `.env`
- database files
- txAdmin private files

### write_file

Write file into known resource.

Uses:

```lua
SaveResourceFile(resource, path, content, #content)
```

Must validate:

- path stays inside resource
- extension allowlist
- max file size

### create_resource

Create folder and files.

Use JS runtime for filesystem:

```js
fs.mkdirSync(...)
fs.writeFileSync(...)
```

Then run:

```lua
ExecuteCommand("refresh")
```

### ensure_resource

Run:

```lua
ExecuteCommand("ensure " .. resource)
Wait(1000)
GetResourceState(resource)
```

Return:

- state before
- state after
- recent console logs
- success boolean

### command

Allowlist only:

```text
refresh
ensure <resource>
start <resource>
stop <resource>
restart <resource>
status
players
say <message>
```

Block:

```text
quit
exec
set
sets
setr
add_ace
add_principal
remove_ace
remove_principal
rcon_password
endpoint_add_tcp
endpoint_add_udp
```

## Console Capture

Backed by `RegisterConsoleListener` from `src/server/console/listener.ts`.

### Ring buffer (memory)

- Bounded ring buffer of recent console lines, default **2000 lines** (~0.5–1 MB).
- Override via convar `agent_api_console_buffer_lines`.
- Each entry: `{ ts, channel, message }`.
- Used by `tail_console` and by per-command capture.
- Not persisted — FiveM already writes its own server log; we only need the recent window.

### Audit log (persistent)

- Separate append-only file at `dist/audit.log` (path overridable via convar).
- Records every agent action: `write_file`, `create_resource`, `ensure/start/stop/restart`, `run_command`.
- One JSON object per line: `{ ts, tool, params, result_code, caller_token_hash }`.

### Capture window (hybrid)

```ts
async function captureAround(fn, opts) {
  const startIdx = consoleBuffer.length;
  await fn();
  if (opts.waitForState) {
    await waitUntil(
      () => GetResourceState(opts.name) === opts.expect,
      opts.timeoutMs ?? 3000,
    );
  } else {
    await sleep(opts.delayMs ?? 1000);
  }
  return consoleBuffer.slice(startIdx);
}
```

- Lifecycle commands (`ensure/start/stop/restart`) → wait until `GetResourceState` matches expected or 3000 ms timeout.
- All other allowlisted commands → fixed 1000 ms delay.
- `tail_console` is independent — just reads tail of buffer with `{ lines?, since_ts?, channel? }`.

## Live Client Testing

User joins the live server and opts in. agent_api can then use them as a test subject for end-to-end checks of resources under development.

### Opt-in flow

1. Player joins server, types `/agent_test_optin` in chat.
2. agent_api server stores a session: `{ license, serverId, expiresAt: now + 30 min }`.
3. Player gets confirmation chat line + reminder of `/agent_test_optout`.
4. Session auto-expires; `/agent_test_optout` revokes immediately.
5. Disconnect drops the session.

Agent cannot register a subject who has not opted in. `register_test_subject` returns `PLAYER_NOT_OPTED_IN` otherwise.

### Client probes

`src/client/probes/` exposes a **fixed, predefined** set of read-only probes — no client-side eval. Each probe:

- Listens for a net event from server: `agent_api:probe:<name>`.
- Collects data via natives.
- Replies with `agent_api:probe:result` carrying `{ probeId, ok, data | error }`.

Initial probe set:

```text
entity_basic     # coords, heading, modelHash, vehicle?
ped_status       # health, armor, isDead, isInVehicle
player_meta      # name, serverId, ping
inventory_snap   # optional bridge to inventory exports
```

Add probes by creating a new file under `src/client/probes/` + registering it in `client/events.ts`. No protocol change needed.

### Server-side surface

- `trigger_client_event` forwards an event name + JSON args to one subject. Agent must already know what event the target resource expects.
- `wait_for_client_event` registers a one-shot net event listener with a timeout and returns the payload (or `TIMEOUT`). Used to close the loop after `trigger_client_event`.
- `send_chat` calls `TriggerClientEvent("chat:addMessage", subject, { args = { text } })`.

### New convars

```cfg
set agent_api_test_session_ttl_seconds 1800
set agent_api_test_max_subjects 4
```

### New error codes

```text
PLAYER_NOT_FOUND
PLAYER_NOT_OPTED_IN
SUBJECT_LIMIT_REACHED
CLIENT_PROBE_TIMEOUT
```

## Concurrency & Limits

### Concurrency

Per-resource serial lock for mutating ops; reads are unlocked.

- Mutating: `write_file`, `create_resource`, `ensure_resource`, `start_resource`, `stop_resource`, `restart_resource`, `refresh_resources`, `run_command`.
- Read-only: `list_resources`, `get_resource_state`, `read_file`, `tail_console`, `list_players`, `get_player_state`.

Impl: `Map<resourceName, Promise<void>>`. Each mutating call awaits the existing chain then appends its work. Lives in `src/server/runtime/locks.ts`.

`refresh_resources` and `run_command` (with no resource scope) lock the synthetic key `__global__`.

### File size

- `read_file` hard limit: **2 MB** → returns `FILE_TOO_LARGE` with `{size, limit}`. Supports `{ offset?, length? }` for windowed reads.
- `write_file` hard limit: **2 MB** → rejects.
- Override via convar `agent_api_max_file_bytes`.

### Rate limit

Token-bucket per token, **120 requests/minute** default. Exceed → `RATE_LIMITED`. Override via convar `agent_api_rate_per_minute`. Implemented in M5.

### Timeouts

- Default request ceiling: **30 s**.
- `wait_for_client_event` ceiling: **60 s**.
- Every tool accepts optional `{ timeout_ms? }` in input; agent can request a longer wait up to the ceiling. Exceeding the ceiling → `INVALID_INPUT`. Hitting timeout → `TIMEOUT`.

New error codes:

```text
FILE_TOO_LARGE
RATE_LIMITED
TIMEOUT
```

## Security

Default bind is localhost only.

Required:

- static token from convar
- max body size
- path traversal checks
- resource name validation
- command allowlist
- audit log every write/action

Convars:

```cfg
# leave token blank/default to auto-generate on first start
set agent_api_token ""
set agent_api_readonly false
set agent_api_root "resources/[agent]"
set agent_api_allow_write_paths ""        # extra write roots, comma-separated
set agent_api_allow_control_paths ""      # extra lifecycle-control roots, comma-separated
```

### Token bootstrap (first run)

If `agent_api_token` is empty or equals `"change-me"`:

1. Generate a 32-byte random token (hex).
2. Persist to `dist/.agent_token` (mode 0600 on POSIX; gitignored).
3. Log a copy-paste-ready block to the FiveM console:

```text
[agent_api] No token configured. Generated new token.
[agent_api] Saved to: dist/.agent_token
[agent_api]
[agent_api] Add this to your Claude Code MCP config:
[agent_api]
[agent_api]   "agent_api": {
[agent_api]     "type": "http",
[agent_api]     "url": "http://127.0.0.1:30120/agent_api/mcp",
[agent_api]     "headers": { "x-agent-token": "<token>" }
[agent_api]   }
[agent_api]
[agent_api] Ready.
```

On subsequent starts, load from `dist/.agent_token`. If the convar is explicitly set (non-empty, not `"change-me"`), that wins and the file is ignored.

Rotate: delete `dist/.agent_token`, restart resource. (Exposed as MCP tool only if a real need shows up.)

## Milestones

Each milestone is independently shippable.

### M0 — Scaffold

- repo layout per "Repo Layout" section
- `tsconfig.json` (strict), `esbuild.config.mjs`, `package.json` scripts
- `fxmanifest.lua` pointing at `dist/server.js` (client later)
- `.gitattributes`: `dist/*.js linguist-generated=true`
- `src/server/index.ts` that logs `agent_api up` on resource start
- `dist/` committed

### M1 — HTTP + auth + read-only API

- `SetHttpHandler` router (`src/server/http/router.ts`)
- middleware: `auth.ts` (token check), `bodyLimit.ts`, `audit.ts`
- token bootstrap (auto-generate + persist `dist/.agent_token` + log copy-paste block)
- zod schemas + error envelope (`{ ok, data | error }`)
- audit log (`dist/audit.log`, append-only JSONL)
- console ring buffer
- tools: `health`, `list_resources`, `get_resource_state`, `read_file`, `tail_console`
- callable via `curl` against `http://127.0.0.1:30120/agent_api/...`

### M2 — Write API

- `src/server/fs/sandbox.ts` (write-root allowlist + blocked paths + extensions)
- per-resource lock (`src/server/runtime/locks.ts`)
- tools: `write_file`, `create_resource`, `refresh_resources`
- audit every write

### M3 — Lifecycle control

- `runtime/command.ts` (allowlisted commands) + `runtime/state.ts`
- `captureAround` (hybrid window: state-poll for lifecycle, fixed 1000 ms otherwise)
- tools: `ensure_resource`, `start_resource`, `stop_resource`, `restart_resource`, `run_command`

### M4 — MCP transport

- `/mcp` endpoint speaking HTTP MCP (Streamable HTTP / SSE)
- JSON Schema generation from zod via `zod-to-json-schema`
- `src/bin/mcp-stdio.ts` → `dist/mcp-stdio.js` (stdio↔HTTP shim)
- smoke test from Claude Code: list tools, call `health`, call `read_file`

### M5 — Live client testing

- `src/client/` folder + `dist/client.js` (esbuild target)
- fxmanifest gains `client_scripts { 'dist/client.js' }`
- `/agent_test_optin` and `/agent_test_optout` chat commands
- session store (`players/registry.ts`) with TTL, disconnect cleanup
- probes: `entity_basic`, `ped_status`, `player_meta`
- tools: `list_players`, `register_test_subject`, `unregister_test_subject`, `get_player_state`, `trigger_client_event`, `send_chat`, `wait_for_client_event`

### M6 — Hardening + Plugin framework

- rate limit (token bucket, 120 req/min default)
- request timeouts wired through every tool (default 30 s, `wait_for_client_event` 60 s, optional `timeout_ms` input)
- file size enforcement everywhere (read window params, write reject)
- optional probe: `inventory_snap` bridging target resource exports
- **plugin framework** (`src/server/plugins/`): each external library = one folder + entry in `plugins/index.ts`
  - bundled: `esx` (es_extended), `oxlib` (@overextended/ox_lib), `oxmysql` (@overextended/oxmysql)
  - auto-detect via `GetResourceState`; opt-out via `agent_api_plugin_<name>_enabled false`
  - `list_plugins` MCP tool exposes status snapshot
- integration tests against a throwaway scratch resource
- `README.md` install guide + Claude Code config snippet

## Plugin Framework

Every external FiveM library that exposes an MCP tool surface lives under `src/server/plugins/<name>/index.ts` and implements:

```ts
export type Plugin = {
  name: string;              // also drives convar prefix
  description: string;
  detect: () => { ok: true } | { ok: false; reason: string };
  install: (ctx: PluginContext) => void;   // call ctx.register(...) per tool
};
```

To add a plugin (e.g. `qbx_core`):

1. Create `src/server/plugins/qbx/index.ts` exporting a `Plugin`.
2. Push it into `ALL_PLUGINS` in `src/server/plugins/index.ts`.
3. Done — loader handles detection, opt-out convar, and status logging.

Bundled plugins:

| Plugin    | Detects        | Source typings                            | Tools                                                                                        |
| --------- | -------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `esx`     | `es_extended`  | hand-rolled (ESX has no first-party npm)  | `esx_list_players`, `esx_get_player` + (rw) `esx_add_money`, `esx_set_job`                   |
| `oxlib`   | `ox_lib`       | `@overextended/ox_lib`                    | `oxlib_notify`, `oxlib_trigger_client_callback`, `oxlib_check_dependency`                    |
| `oxmysql` | `oxmysql`      | `@overextended/oxmysql`                   | `oxmysql_query`, `oxmysql_scalar`, `oxmysql_execute` (gated by readonly + statement allowlist) |

Convars per plugin:

```cfg
set agent_api_plugin_esx_enabled         auto    # auto | true | false
set agent_api_plugin_oxlib_enabled       auto
set agent_api_plugin_oxmysql_enabled     auto
set agent_api_plugin_oxmysql_readonly    true    # SELECT-only when true
set agent_api_plugin_oxmysql_allow_statements "SELECT"   # csv, uppercase
```

Rough sizing: each milestone ≈ 1–3 days of focused work; full plan ≈ ~2 weeks end-to-end.
