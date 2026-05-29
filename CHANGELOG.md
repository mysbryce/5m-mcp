# Changelog

All notable changes to this project will be documented in this file.

## [0.7.0] — 2026-05-29

### Added

- **Work-tracking sessions** — the agent publishes a per-resource task board
  (current task + todo list) via the new **`track_work`** / **`track_get`**
  tools, surfaced read-only in a new dashboard **Sessions** tab. A session is
  auto-seeded when `create_resource` runs.
- **Dashboard → agent requests** — click ✎ on any file or folder in the
  Sessions file tree (or "ask about the whole resource") to queue a request.
  Pending requests are surfaced to the agent via injected tool-result text; it
  reads them with **`get_requests`** and closes them with **`resolve_request`**.
  A null path targets the whole resource.
- **`run_shell` rtk integration** — the bundled `rtk` (Rust Token Killer) is now
  an allowlisted binary (resolved from `bin/`, no PATH entry needed). Pass
  `useRtk:true` to wrap any command as `rtk <command> <args>` for token-
  compressed output.
- **Version build-hash fingerprint** — every build hashes its output bundles and
  writes `dist/version.json`, stamps `fxmanifest.lua` (`version 'X.Y.Z+<hash>'`),
  and exposes the result via `GET /health`, the `health` tool, and MCP
  `serverInfo`. Lets you tell whether a rebuild was actually deployed.

### Changed

- **`agent_api_readonly` now defaults to `true`** — safe by default; set it
  `false` to allow writes / shell. Intended for local / single-machine dev.
- **`run_shell` output** keeps the first + last 32 KB per stream (with a
  byte-count marker for the dropped middle) instead of a raw 1 MB cap, so long
  build logs no longer flood the agent context.
- **`EXTENSION_NOT_ALLOWED`** errors no longer echo the full ~100-item allowlist;
  they return a compact message + count.

### Fixed / hardened

- **`audit.log`** truncates oversized params (e.g. `write_file` bodies) to a
  2 KB preview and rotates past 5 MB (single `.1` backup).

## [0.6.2] — 2026-05-28

### Added

- **`security-review` MCP prompt** — a FiveM cheat-prevention audit workflow.
  Reads the whole codebase first, then interrogates each client→server trust
  decision one question at a time with two choices (Answer / Skip): a **skipped**
  point is recorded as MUST-IMPROVE (no justification = treated as unprotected),
  an **answered** one is verified against the actual server-side guard in the
  code. Targets forged net events, client-authoritative state, NUI-callback
  trust, `load`/`ExecuteCommand`, SQL injection, over-broad exports, and leaked
  secrets; ends with a severity-ranked fix list.

### Security

- **Removed `dist/.agent_token` from the fxmanifest `files {}` block.** Listing it
  there exposed the agent token to clients (fetchable via `cfx-nui-agent_api/...`
  or a resource dump). The server reads the token from disk via `GetResourcePath`,
  so it never needed to be a client-streamed file. **If a server ran with the old
  manifest, rotate the token: `rm dist/.agent_token && restart agent_api`.**

## [0.6.1] — 2026-05-28

### Fixed

- **`run_shell` on Windows** — npm/npx/pnpm/yarn/vite are `.cmd` shims that Node
  refuses to spawn without a shell, so `run_shell npm install` failed with
  `spawn ENOENT`. It now uses `shell: true` on win32 and rejects shell
  metacharacters (`& | < > ^`, newlines) in args to keep the shell from being
  usable for injection. (Surfaced by an end-to-end mechanical-loop test that built
  a full Lua + SolidJS/Vite resource through the MCP tools.)
- Removed stray `dist/_*.txt` scratch files that had been committed accidentally,
  and added `dist/_*` to `.gitignore`.

## [0.6.0] — 2026-05-28

### Added

- **Dashboard "Logs" tab** (master only):
  - **Console** — realtime (incremental ~1.5s polling via `/api/console` with
    `sinceTs`), with FiveM `^0`–`^9` caret colors parsed (txAdmin-style) and the
    color force-reset at end of each line; live toggle + auto-scroll.
  - **Audit** — the trail of every agent tool call (time / tool / result / caller
    hash) from `dist/audit.log` (`readRecentAudit`), with tool filter, OK/error
    filter, sortable columns, and pagination.
  - Console prefixes render in a fixed-width, right-aligned column (txAdmin-style)
    with a monospace family and a **deterministic per-prefix color** (each
    resource/channel hashes to its own stable shade); tab nav gained icons and
    Monitor is the master's default landing tab.
- **Workflow MCP prompts**: `debug-resource` (state → restart → wait_for_console
  → scan_errors → read → fix → verify loop) and `add-db-table` (schema → confirm
  → oxmysql_migrate → verify → parameterised code).
- **MCP resource template** `agent://file/{resource}/{path}` (via
  `resources/templates/list`) — read any file in a resource through the MCP
  resources interface, not just the four fixed snapshots.
- **`oxmysql_migrate`** — run a DDL statement (gated like `oxmysql_execute`) and
  optionally return the resulting table schema to confirm the migration.

## [0.5.0] — 2026-05-28

### Added

- **`list_exports` + `call_export`** — generic resource-export introspection and
  invocation. `call_export` runs `exports[resource][name](...args)` on any started
  resource (not just the bundled bridges), behind the same read-verb gate as the
  reflective native tools plus an `agent_api_export_blocked_methods` blocklist.
- **`multi_edit`** — apply many edits across several files of a resource in one
  call. Every edit is validated in memory first; nothing is written unless all
  pass, so a bad edit can't leave a half-applied set. Saves round-trips vs.
  repeated `edit_file`.
- **`server_metrics`** — server health snapshot: uptime, online player count,
  resource counts by state, and the agent_api host process memory (rss / heap).

## [0.4.2] — 2026-05-28

### Changed

- **Token-usage reductions** across the high-volume tools:
  - `list_dir` / `find_files` / `search_code` now skip generated build output
    (`dist`, `build`, `out`, `coverage`, `vendor`) by default — no more matches
    from minified bundles. Pass `includeBuilt:true` to search them anyway.
  - MCP `resources/read` now returns compact JSON (no pretty-print indentation).
  - The preference auto-injection only fires on `create_resource` /
    `scaffold_fivem_resource_workflow` (not every `write_file` / `edit_file`), and
    its reminder text is much shorter.

## [0.4.1] — 2026-05-28

### Changed

- **NUI interaction now reaches inside a resource's iframe.** FiveM's CEF exposes
  a single CDP target (`nui://game/ui/root.html`) with every resource's NUI as a
  cross-origin child iframe. `nui_*` now resolves the target frame via
  `Page.getFrameTree` and evaluates in an isolated world (`Page.createIsolatedWorld`),
  so `nui_click`/`nui_fill`/`nui_get`/`nui_eval` with a `resource` hit that
  resource's own DOM instead of the root document. Falls back to the root frame
  when no `resource` is given or no frame matches (`frameMatched:false`).

## [0.4.0] — 2026-05-28

### Added

- **File management**: `delete_file` and `move_file` (move = rename within a
  resource; `createDirs` / `overwrite`). Same readonly / write-root / extension
  gates as `write_file`; `delete_file` refuses directories and blocked segments.
- **`get_resource_manifest`** — parse a resource's `fxmanifest.lua` (or legacy
  `__resource.lua`) into structured metadata: fx_version, game, name, author,
  version, description, ui_page, lua54, and the script / files / dependency lists.
- **`scan_errors`** — scan the console ring buffer for FiveM SCRIPT ERRORs, Lua
  tracebacks, and JS exceptions, returning structured `{ ts, channel, message,
  frames: [{ resource, file, line }] }`. Filter by `resource` / `sinceTs`.
- **NUI interaction over CDP** — `nui_eval`, `nui_click`, `nui_fill`, `nui_get`
  drive the live NUI over the same Chrome DevTools Protocol connection used for
  screenshots (no Playwright). Pass `resource` to target that resource's iframe.
  New `dist/nui-interact.js` bin.
- **`oxmysql_schema`** — read-only `information_schema` introspection (tables →
  columns: name, type, key, nullable, default) so the agent writes schema-aware
  data code. Scope with `table`.
- **MCP `resources/` capability** — `resources/list` + `resources/read` expose
  read-only JSON snapshots: `agent://console`, `agent://resources`,
  `agent://preferences`, `agent://skills`.

## [0.3.0] — 2026-05-28

### Added

- **Code navigation tools**: `list_dir` (flat or recursive file tree),
  `find_files` (glob like `server/**/*.lua`), and `search_code` (substring or
  regex grep → file/line/text, skips binaries). All read-only, sandboxed to a
  resource, skip `node_modules` / dot-dirs.
- **`edit_file`** — surgical string replacement in an existing file with a
  unique-match guard (`replaceAll` to override). Cheaper and safer than
  rewriting whole files via `write_file`; same readonly / write-root / extension
  gates, and triggers the preference auto-injection like other write tools.
- **`wait_for_console`** — block until a console line matches `pattern` (or
  `timeoutMs`, default 5000). Pairs with `ensure_resource` / `restart_resource`
  to detect the boot banner or an error without busy-polling `tail_console`.
  `matched:false` on timeout is a normal result, not an error.

## [0.2.0] — 2026-05-27

### Added

- **Dashboard "Preferences" tab** (master only) — teach the agent how you like
  resources built, tagged `structure` / `coding` / `ui-design`, each with a
  free-text description and an optional example folder picked through a
  server-backed, sandboxed folder browser. Stored in `dist/preferences.json`
  (file-backed, not hardcoded). New MCP tool `list_preferences` exposes them, and
  a reminder is auto-injected into `write_file` / `create_resource` /
  `scaffold_fivem_resource_workflow` / `run_shell` results so the agent mirrors
  them (Lua AND UI).
- **Dashboard "Skills" tab** (master only) — upload a custom markdown skill (paste
  or `.md` file) and bind it to MCP actions by **tool name and/or category**
  (write / lifecycle / scaffold / ui / native / player / shell / plugin). When a
  bound tool runs, the skill body is injected into the result. Stored in
  `dist/skills.json` + `dist/skills/<id>.md`. New MCP tool `list_skills`.
- Dashboard folder-browse + preference/skill REST APIs under
  `/agent_api/dashboard/api/*` (master-gated); EN + TH locale strings for both
  new tabs.

### Changed

- **Grill workflow** (`scaffold-fivem-resource`) now calls `list_preferences`
  first and folds preferences into its recommendations, **skips questions the
  user already answered/decided** (confirms instead of re-asking), enforces
  lettered A/B/C/D options with a Recommended pick, and asks its own clarifying
  questions when intent is unclear instead of blindly following the script.
- **Much broader file-extension allowlist** out of the box, and `read_file` now
  shares the (large) write allowlist instead of a tiny 9-extension read set — so
  `.svelte` / `.vue` / `.scss` / `.mdx` / `.graphql` / `.sql` / shell scripts /
  most tool dotfiles can be read as well as written. `agent_api_extra_write_extensions`
  still extends both read and write.

## [0.1.4] — 2026-05-27

### Changed

- Project rebranded to **5m-mcp** for display/branding (README title, docs site
  title + sidebar label, npm package names). The installed FiveM resource keeps
  its technical name `agent_api` — convars (`agent_api_*`), HTTP routes
  (`/agent_api/...`), ACE identifiers (`resource.agent_api`), and the MCP
  `serverInfo.name` are unchanged, so existing installs need no migration.

## [0.1.3] — 2026-05-27

### Added

- Dashboard permission labels, descriptions, and group names are now
  translated. The text lives in the locale JSON keyed by convar
  (`perm.<convar>.label` / `.desc`, `permGroup.<Group>`); the server still
  owns the structural metadata. Missing keys fall back to the server's
  English. Full Thai set for all 14 permissions + 4 groups.

## [0.1.2] — 2026-05-27

### Added

- Dashboard internationalisation (English + Thai). Languages are JSON-only:
  drop `dashboard/src/i18n/locales/<code>.json` and Vite's import.meta.glob
  registers it at build time — no code change. Inter (Latin) + Noto Sans Thai
  fonts, locale persisted to localStorage, navigator-language detection.
- Custom `UiSelect` dropdown replacing every native `<select>` (language
  switcher, enum permissions, role picker) — themed, click-outside/Escape to
  close, check-marked active option.

## [0.1.1] — 2026-05-27

### Fixed

- **Resource failed to load** with `SyntaxError: Identifier '_r' has already
  been declared`. esbuild's identifier minification produced short names that
  FiveM's CitizenJS script host rejected as duplicate top-level declarations.
  Disabled `minifyIdentifiers` (and `keepNames`); whitespace + syntax
  minification stay on. dist/server.js is larger but loads correctly.

## [0.1.0] — 2026-05-27

Feature release on top of the M0–M6 core.

### Added

- **Web dashboard** at `/agent_api/dashboard` — first-visit signup creates a
  master account, signup then closes; master manages users and edits the
  sandbox permission convars live (SetConvar + reload, persisted to
  `dist/permissions.json`). scrypt-hashed accounts in `dist/users.json`,
  12h sessions. UI is a Vite + Vue 3 project (`dashboard/`) built to a
  single committed `dist/dashboard/index.html`.
- `run_shell` — allowlisted shell binary (npm/npx/pnpm/yarn/bun/vite/git/node)
  inside a resource folder, used by the scaffold workflow to build Vite UIs.
- `server_call_native` / `server_list_natives` — reflective server-side
  native dispatch with readonly verb gate + built-in danger blocklist.
- `client_call_native` / `client_list_natives` — reflective client-side
  native dispatch on opted-in subjects, with `$ped`/`$vehicle`/... arg tokens.
- `screenshot_nui` / `delete_screenshot` — capture the live NUI over CEF CDP
  (raw WebSocket, no Playwright); `isolate` mode hides sibling iframes.
- `scaffold_fivem_resource_workflow` tool + `scaffold-fivem-resource` MCP
  prompt — mandatory grill workflow before scaffolding a new resource.
- Widened `write_file` extension allowlist (.vue/.svelte/.tsx/.scss/.toml/…)
  + `agent_api_extra_write_extensions`.
- MCP `prompts/list` + `prompts/get` capability.
- Documentation site (Next.js 15 + fumadocs) published to GitHub Pages.

### Changed

- esbuild builds are minified by default (`--dev`/`--watch` skip it).

## [0.0.1] — 2026-05-27

Initial pre-release. All M0–M6 milestones complete; verified against a live ESX
Legacy server.

### Added

- **M0 — scaffold**: TypeScript + esbuild build, oxlint/oxfmt, fxmanifest with
  full convar surface.
- **M1 — HTTP + read-only API**: SetHttpHandler router, auto-generating token
  bootstrap, audit log, console ring buffer, 5 read-only tools.
- **M2 — write API**: per-resource serial lock, sandbox enforcement,
  `write_file`, `create_resource`, `refresh_resources`.
- **M3 — lifecycle control**: hybrid capture-around (state-poll or fixed
  delay), `ensure/start/stop/restart_resource`, `run_command` (allowlist),
  self-target guard.
- **M4 — MCP transport**: HTTP MCP at `/mcp` (initialize, ping, tools/list,
  tools/call, notifications), zod → JSON Schema gen, stdio shim
  (`bin/mcp-stdio.js`).
- **M5 — live player testing**: `/agent_test_optin` chat command + session
  registry, client-side predefined probes (entity_basic, ped_status,
  player_meta, inventory_snap), 7 player tools.
- **M6 — hardening + plugin framework**:
  - token-bucket rate limit (default 120 req/min) on `/mcp` and `/tools/*`.
  - plugin loader with auto-detect + `agent_api_plugin_<name>_enabled` opt-out.
  - bundled plugins: **esx** (8 tools incl. reflective `esx_call_shared` /
    `esx_call_player`), **oxlib** (5 tools incl. `oxlib_call`),
    **oxmysql** (3 tools, readonly + SELECT-only by default).
  - **dynamic client-native dispatch**: `client_call_native` + `client_list_natives`
    with arg-token substitution (`$ped`, `$vehicle`, …), readonly verb gate,
    per-native blocklist convar.

### Tooling

- `npm run smoke` against live server: 27+ probes, pass/fail tally, non-zero
  exit on any failure.
- `npm run generate:resource` builds a clean drop-in folder at
  `out/agent_api/` for distribution.
- `scripts/dev-link.ps1` junctions repo into `<server>/resources/[agent]/agent_api/`.
