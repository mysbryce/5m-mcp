<!--
  Release notes for `npm run git:release`. Edit this before cutting a release.
  The release title + git tag are derived automatically as v<version>+<hash>
  from dist/version.json — you only maintain the body below.
-->

Drop-in build attached as `agent_api.zip` — extract into `resources/[agent]/`, then `refresh` → `ensure agent_api`.

## Added
- **Work-tracking sessions** — agent publishes a per-resource task board (current task + todos) via `track_work` / `track_get`, shown in a new dashboard **Sessions** tab; auto-seeded on `create_resource`.
- **Dashboard → agent requests** — click ✎ on a file/folder (or the whole resource) to queue a request; agent reads it via `get_requests` (surfaced through injected tool-result text) and closes it with `resolve_request`.
- **rtk in `run_shell`** — bundled `rtk` (Rust Token Killer) is allowlisted and run from `bin/`; `useRtk:true` wraps any command for token-compressed output.
- **Version build-hash fingerprint** — each build hashes its output, writes `dist/version.json`, stamps `fxmanifest.lua` as `version 'X.Y.Z+<hash>'`, and reports it via `GET /health`, the `health` tool, and MCP `serverInfo`.

## Changed
- **`agent_api_readonly` now defaults to `true`** — safe by default; set `false` to allow writes / shell.
- **`run_shell` output** keeps first + last 32 KB per stream (byte-count marker for the dropped middle) instead of a raw 1 MB cap.
- **`EXTENSION_NOT_ALLOWED`** errors return a compact message + count instead of the full ~100-item allowlist.

## Fixed / hardened
- **`audit.log`** truncates oversized params (e.g. `write_file` bodies) to a 2 KB preview and rotates past 5 MB (single `.1` backup).
- **`generate:resource`** now bundles `bin/rtk`, `dist/version.json`, and the nui/screenshot helper bundles into the packaged resource.
