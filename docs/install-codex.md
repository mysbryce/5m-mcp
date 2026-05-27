# Installing agent_api into Codex CLI

Two paths:

- **A) Auto-install via Codex itself.** Copy the prompt below into a Codex session and let the agent edit your config.
- **B) Manual.** Skip to the bottom for the TOML snippet you can paste yourself.

---

## A) Auto-install prompt for Codex

Works from any working directory. Paste the whole block as-is — Codex will discover the repo on its own.

````
Install the `agent_api` MCP server into my Codex configuration.

# Inputs (do not ask me unless step 1 fails)

- AGENT_API_REPO: leave blank — discover automatically (see step 1).
- AGENT_API_URL : default `http://127.0.0.1:30120/agent_api/mcp` unless I told you otherwise.

# Steps (execute in order, stop on first failure)

1. **Locate the agent_api repo** (the directory that contains `dist/mcp-stdio.js` and `dist/.agent_token`). Try, in order, until one matches:
   a. The current working directory.
   b. Walking up from cwd: cwd, parent, grandparent (max 5 levels).
   c. Common dev paths on this OS:
      - Windows: `D:/Sure/5m-mcp`, `C:/dev/5m-mcp`, `C:/projects/5m-mcp`, `%USERPROFILE%/5m-mcp`, `%USERPROFILE%/dev/5m-mcp`, `%USERPROFILE%/Documents/5m-mcp`
      - macOS / Linux: `~/5m-mcp`, `~/dev/5m-mcp`, `~/projects/5m-mcp`, `~/src/5m-mcp`, `~/code/5m-mcp`
   d. `git rev-parse --show-toplevel` if cwd is inside a clone.
   e. As a last resort: ask me for the absolute path of the agent_api repo and re-run step 1 with that.

   Save the absolute path as REPO. From here on every path is relative to REPO.

2. Verify `REPO/dist/.agent_token` exists. If missing, stop and tell me to ensure the FiveM server has started `agent_api` at least once — the token is generated on first start.

3. Read the token from `REPO/dist/.agent_token` (trim whitespace).

4. Resolve `REPO/dist/mcp-stdio.js`. If missing, run `npm run build` inside REPO, then verify it appeared.

5. Resolve the Codex config path:
   - On Windows: `%USERPROFILE%\.codex\config.toml`
   - On macOS / Linux: `~/.codex/config.toml`
   Create the parent directory if missing.

6. If the config file does not exist, create it with this content (substituting <ABSOLUTE_PATH> and <TOKEN>):

   ```toml
   [mcp_servers.agent_api]
   command = "node"
   args = ["<ABSOLUTE_PATH_TO_dist/mcp-stdio.js>"]
   startup_timeout_ms = 10000

   [mcp_servers.agent_api.env]
   AGENT_API_URL = "http://127.0.0.1:30120/agent_api/mcp"
   AGENT_API_TOKEN = "<TOKEN>"
   ```

7. If the config file already exists:
   - Make an in-memory backup of the original bytes.
   - Parse it as TOML.
   - If `[mcp_servers.agent_api]` already exists, overwrite only the `args` path and the `AGENT_API_TOKEN` value. Leave any other settings (timeouts, sandbox flags) untouched.
   - If it does not exist, append the block above.
   - Preserve every other section in the file.

8. Verify the file parses as valid TOML after the edit. If it fails to parse, restore from the backup and report the error.

9. Print a summary:
   - REPO absolute path
   - the absolute path of the config file
   - whether the block was created or updated
   - the first 8 characters of the token (do NOT print the full token)
   - the absolute path of `mcp-stdio.js`

10. Tell me to restart any running Codex session for the new MCP server to load.

Do not modify any other files. Do not start any FiveM resources. Do not commit the change.
````

The agent should respond with a one-screen summary; no follow-up is normally needed.

---

## B) Manual install

1. Make sure agent_api is running on your FiveM server and `dist/.agent_token` exists.
2. Open `~/.codex/config.toml` (or `%USERPROFILE%\.codex\config.toml` on Windows). Create it if missing.
3. Append:

   ```toml
   [mcp_servers.agent_api]
   command = "node"
   args = ["C:/full/path/to/5m-mcp/dist/mcp-stdio.js"]
   startup_timeout_ms = 10000

   [mcp_servers.agent_api.env]
   AGENT_API_URL = "http://127.0.0.1:30120/agent_api/mcp"
   AGENT_API_TOKEN = "paste-token-from-dist/.agent_token"
   ```

4. Restart Codex.
5. Smoke check: ask Codex `list MCP tools` — `agent_api` should appear with ~36 tools.

---

## Notes

- The shim is a thin stdio↔HTTP bridge (~100 LOC, `src/bin/mcp-stdio.ts`). All real work runs in the FiveM resource.
- If the token rotates (you deleted `dist/.agent_token` and restarted the resource), re-run the install prompt — it overwrites `AGENT_API_TOKEN`.
- For Claude Code, use the HTTP transport block printed in the FiveM console on first start instead. The stdio shim is only needed for clients that don't speak HTTP MCP natively.
