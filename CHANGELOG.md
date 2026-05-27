# Changelog

All notable changes to this project will be documented in this file.

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
