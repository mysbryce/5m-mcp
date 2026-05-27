# Error codes

Every failed tool call returns:

```json
{
  "ok": false,
  "error": {
    "code": "<STABLE_ENUM>",
    "message": "human readable",
    "details": { /* optional, machine-readable */ }
  }
}
```

`code` is a stable enum — append-only across versions. Branch on `code`, not on `message`.

## Codes

| Code | HTTP | Meaning |
| --- | :-: | --- |
| `UNAUTHORIZED` | 401 | `x-agent-token` missing or wrong |
| `INVALID_INPUT` | 400 | zod schema validation failed; `details.issues` lists the violations |
| `NOT_FOUND` | 404 | Generic 404 (route or referenced file) |
| `TOOL_NOT_FOUND` | 404 | Tool name not registered |
| `RESOURCE_NOT_FOUND` | 404 | Resource name not registered with FiveM (or state is `missing`) |
| `PATH_OUTSIDE_SANDBOX` | 403 | Computed path escapes the resource root, the write root, or the screenshot dir |
| `PATH_BLOCKED` | 403 | Path contains a blocked segment (`.env`, `txData`, `database`, `cache`) inside the resource |
| `EXTENSION_NOT_ALLOWED` | 403 | File extension not in the write allowlist |
| `FILE_TOO_LARGE` | 413 | Content or stat size exceeds `agent_api_max_file_bytes` |
| `COMMAND_NOT_ALLOWED` | 403 | Console verb / shell binary / SQL statement / native is gated or blocklisted |
| `RESOURCE_FAILED_TO_START` | 500 | Lifecycle command ran but state didn't reach the expected value before timeout |
| `PLAYER_NOT_FOUND` | 404 | Server id not online, or not present in the framework's player table |
| `PLAYER_NOT_OPTED_IN` | 403 | Subject hasn't run `/agent_test_optin`, or is opted in but not in the active subject pool |
| `SUBJECT_LIMIT_REACHED` | 429 | Active subject pool is full (`agent_api_test_max_subjects`) |
| `CLIENT_PROBE_TIMEOUT` | 504 | Client probe didn't respond within `timeoutMs` |
| `BODY_TOO_LARGE` | 413 | HTTP request body exceeds 5 MB |
| `RATE_LIMITED` | 429 | Token bucket exhausted; `details.retryAfterMs` says when to retry |
| `TIMEOUT` | 504 | Tool-level timeout (lifecycle wait, ox_lib callback, shell, screenshot) |
| `INTERNAL` | 500 | Fallback for uncaught errors. `details` typically carries `stderr` or the inner error message |

## Adding a code

1. Append to `ErrorCode` in `src/server/errors/codes.ts`.
2. Add a matching entry to `HTTP_STATUS` in the same file (compiler enforces exhaustiveness).
3. Use it in your tool handler via `err('YOUR_NEW_CODE', message, details?)`.

The enum is append-only — never repurpose a code's meaning.
