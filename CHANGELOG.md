# Changelog

All notable changes to this project will be documented in this file.

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
