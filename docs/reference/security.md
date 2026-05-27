# Security model

`agent_api` runs in your live FiveM server's process and can move money in ESX, kick players, run SQL, and rewrite resources. Every part of the design assumes the token might leak; layered defences keep one mistake from being catastrophic.

## Defence layers

| Layer | Enforced by | What it stops |
| --- | --- | --- |
| 1 — Token | `x-agent-token` header check on every request except `GET /health` | Random scanners on `:30120` |
| 2 — Body limit | 5 MB cap, returns `BODY_TOO_LARGE` | Denial via oversized POST |
| 3 — Rate limit | Token bucket, 120 req/min default per token hash, returns `RATE_LIMITED` | Runaway agent loops |
| 4 — JSON parse | Throws `INVALID_INPUT` on malformed JSON | Garbage payloads |
| 5 — zod schema | Per-tool `.strict()` schema | Unknown fields, wrong types |
| 6 — Readonly mode | `agent_api_readonly=true` blocks every mutating tool | Production lock-down |
| 7 — Path sandbox | `sandbox.ts` + per-tool checks | `..`, absolute paths, `txData/.env/database/cache` segments, writes outside configured roots |
| 8 — Extension allowlist | `WRITE_EXTENSIONS` set | Writing `.exe`, `.sh`, binary blobs |
| 9 — Verb allowlist | `parseAllowedCommand` for `run_command` | Banned console verbs (`quit`, `exec`, `add_ace`, `rcon_password`, …) |
| 10 — ACE | FiveM's own ACL on `command.*` | Agent calling lifecycle verbs without server permission |
| 11 — Per-resource lock | `withLock(name, fn)` | Two mutators racing on the same resource |
| 12 — Self-target guard | `runLifecycle` refuses if resource = `agent_api` | A known FiveM Mono SIGSEGV |
| 13 — Subject opt-in | `/agent_test_optin` chat command + TTL session | Acting on non-consenting players |
| 14 — Native blocklists | Per-tool blocklists + a built-in danger list | `DropPlayer`, `ExecuteCommand`, `StopResource` via reflective natives |
| 15 — Plugin gates | Per-plugin convars (e.g. `agent_api_plugin_oxmysql_readonly`) | Open SQL access by default |
| 16 — Audit log | Append-only `dist/audit.log` JSONL | Forensics after the fact |

## Token handling

- **Storage.** `dist/.agent_token`, mode `0600` on POSIX. Gitignored.
- **In transit.** `x-agent-token` header. We do not log the full token anywhere — the audit log records `sha256(token).slice(0, 12)` only.
- **Rotation.** `rm dist/.agent_token && restart agent_api`. The console prints a new MCP config block with the new token.

## Network exposure

- Default bind: `127.0.0.1`. The FiveM HTTP handler does not expose `agent_api/*` paths externally unless you've opened `30120` to the internet (don't).
- For remote dev, SSH-tunnel `30120` to your dev machine.

## Reflective dispatch — what makes it safe

Reflective tools (`server_call_native`, `client_call_native`, `esx_call_player`, `oxlib_call`) can in principle call anything. They survive review because of three layered checks:

1. **Built-in danger blocklist** (server only) — `DropPlayer`, `ExecuteCommand`, etc. always refused regardless of `readonly`.
2. **Convar blocklist** — operator-controlled, applies to every reflective call.
3. **Readonly verb heuristic** — when `readonly=true`, only method names starting with `Get/Has/Is/Does/Can/Will/Network` pass. Anything else (`Set`, `Add`, `Delete`, `Drop`, `Spawn`, …) refused.

These layers compose. Even with `readonly=false` (the dev default), `DropPlayer` is still blocked.

## What's intentionally NOT defended

- **A compromised host machine.** If an attacker can read `dist/.agent_token`, they can act as the agent.
- **A malicious server operator.** The operator controls every convar. If they turn off rate limit, sandbox, and blocklist, then hand the token to a third party, that's on them.
- **A malicious agent.** A misbehaving LLM agent can still spam allowed calls. We have rate limit + audit log, not behavioural detection.

## Responsible disclosure

Sandbox bypasses, gate-circumvention paths, or anything that lets a caller escape the readonly/blocklist surfaces should be reported privately to **fx.frame009@gmail.com** before any public issue. See [CONTRIBUTING.md](https://github.com/mysbryce/5m-mcp/blob/main/CONTRIBUTING.md).
