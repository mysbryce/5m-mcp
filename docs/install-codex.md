# Installing agent_api into Codex CLI

Two paths:

- **A) Auto-install via Codex itself.** Copy the prompt below into a Codex session and let the agent edit your config.
- **B) Manual.** Skip to the bottom for the TOML snippet you can paste yourself.

---

## A) Auto-install prompt for Codex

Open a Codex session in the directory where `agent_api` was built (the repo with `dist/.agent_token` in it), then paste:

````
Install the `agent_api` MCP server into my Codex configuration.

Steps you must execute, in order:

1. Verify that the file `dist/.agent_token` exists in the current working directory. If it does not, stop and ask me to run the FiveM server with the `agent_api` resource started first — the token is generated on first start.

2. Read the token from `dist/.agent_token` (trim whitespace).

3. Resolve the absolute path of `dist/mcp-stdio.js` in the current working directory. If it does not exist, run `npm run build` first, then verify the file appeared.

4. Resolve the Codex config path:
   - On Windows: `%USERPROFILE%\.codex\config.toml`
   - On macOS / Linux: `~/.codex/config.toml`
   Create the parent directory if missing.

5. If the config file does not exist, create it with this content (substituting <ABSOLUTE_PATH> and <TOKEN>):

   ```toml
   [mcp_servers.agent_api]
   command = "node"
   args = ["<ABSOLUTE_PATH_TO_dist/mcp-stdio.js>"]
   startup_timeout_ms = 10000

   [mcp_servers.agent_api.env]
   AGENT_API_URL = "http://127.0.0.1:30120/agent_api/mcp"
   AGENT_API_TOKEN = "<TOKEN>"
   ```

6. If the config file already exists:
   - Parse it as TOML.
   - If `[mcp_servers.agent_api]` already exists, overwrite only the `args` path and the `AGENT_API_TOKEN` value. Leave any other settings (timeouts, sandbox flags) untouched.
   - If it does not exist, append the block above.
   - Preserve every other section in the file.

7. Verify the file parses as valid TOML after the edit. If it fails to parse, restore from the backup you made in step 6 and report the error.

8. Print a summary:
   - the absolute path of the config file
   - whether the block was created or updated
   - the first 8 characters of the token (do NOT print the full token)
   - the absolute path of `mcp-stdio.js`

9. Tell me to restart any running Codex session for the new MCP server to load.

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
