import{c as a,Q as n,j as e,m as p}from"./chunks/framework.CTNaDwNv.js";const m=JSON.parse('{"title":"Installing agent_api into Codex CLI","description":"","frontmatter":{},"headers":[],"relativePath":"install-codex.md","filePath":"install-codex.md","lastUpdated":1779849271000}'),t={name:"install-codex.md"};function i(l,s,o,r,c,d){return n(),e("div",null,[...s[0]||(s[0]=[p(`<h1 id="installing-agent-api-into-codex-cli" tabindex="-1">Installing agent_api into Codex CLI <a class="header-anchor" href="#installing-agent-api-into-codex-cli" aria-label="Permalink to &quot;Installing agent_api into Codex CLI&quot;">​</a></h1><p>Two paths:</p><ul><li><strong>A) Auto-install via Codex itself.</strong> Copy the prompt below into a Codex session and let the agent edit your config.</li><li><strong>B) Manual.</strong> Skip to the bottom for the TOML snippet you can paste yourself.</li></ul><hr><h2 id="a-auto-install-prompt-for-codex" tabindex="-1">A) Auto-install prompt for Codex <a class="header-anchor" href="#a-auto-install-prompt-for-codex" aria-label="Permalink to &quot;A) Auto-install prompt for Codex&quot;">​</a></h2><p>Works from any working directory. Paste the whole block as-is — Codex will discover the repo on its own.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Install the \`agent_api\` MCP server into my Codex configuration.</span></span>
<span class="line"><span></span></span>
<span class="line"><span># Inputs (do not ask me unless step 1 fails)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- AGENT_API_REPO: leave blank — discover automatically (see step 1).</span></span>
<span class="line"><span>- AGENT_API_URL : default \`http://127.0.0.1:30120/agent_api/mcp\` unless I told you otherwise.</span></span>
<span class="line"><span></span></span>
<span class="line"><span># Steps (execute in order, stop on first failure)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. **Locate the agent_api repo** (the directory that contains \`dist/mcp-stdio.js\` and \`dist/.agent_token\`). Try, in order, until one matches:</span></span>
<span class="line"><span>   a. The current working directory.</span></span>
<span class="line"><span>   b. Walking up from cwd: cwd, parent, grandparent (max 5 levels).</span></span>
<span class="line"><span>   c. Common dev paths on this OS:</span></span>
<span class="line"><span>      - Windows: \`D:/Sure/5m-mcp\`, \`C:/dev/5m-mcp\`, \`C:/projects/5m-mcp\`, \`%USERPROFILE%/5m-mcp\`, \`%USERPROFILE%/dev/5m-mcp\`, \`%USERPROFILE%/Documents/5m-mcp\`</span></span>
<span class="line"><span>      - macOS / Linux: \`~/5m-mcp\`, \`~/dev/5m-mcp\`, \`~/projects/5m-mcp\`, \`~/src/5m-mcp\`, \`~/code/5m-mcp\`</span></span>
<span class="line"><span>   d. \`git rev-parse --show-toplevel\` if cwd is inside a clone.</span></span>
<span class="line"><span>   e. As a last resort: ask me for the absolute path of the agent_api repo and re-run step 1 with that.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>   Save the absolute path as REPO. From here on every path is relative to REPO.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>2. Verify \`REPO/dist/.agent_token\` exists. If missing, stop and tell me to ensure the FiveM server has started \`agent_api\` at least once — the token is generated on first start.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. Read the token from \`REPO/dist/.agent_token\` (trim whitespace).</span></span>
<span class="line"><span></span></span>
<span class="line"><span>4. Resolve \`REPO/dist/mcp-stdio.js\`. If missing, run \`npm run build\` inside REPO, then verify it appeared.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>5. Resolve the Codex config path:</span></span>
<span class="line"><span>   - On Windows: \`%USERPROFILE%\\.codex\\config.toml\`</span></span>
<span class="line"><span>   - On macOS / Linux: \`~/.codex/config.toml\`</span></span>
<span class="line"><span>   Create the parent directory if missing.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>6. If the config file does not exist, create it with this content (substituting &lt;ABSOLUTE_PATH&gt; and &lt;TOKEN&gt;):</span></span>
<span class="line"><span></span></span>
<span class="line"><span>   \`\`\`toml</span></span>
<span class="line"><span>   [mcp_servers.agent_api]</span></span>
<span class="line"><span>   command = &quot;node&quot;</span></span>
<span class="line"><span>   args = [&quot;&lt;ABSOLUTE_PATH_TO_dist/mcp-stdio.js&gt;&quot;]</span></span>
<span class="line"><span>   startup_timeout_ms = 10000</span></span>
<span class="line"><span></span></span>
<span class="line"><span>   [mcp_servers.agent_api.env]</span></span>
<span class="line"><span>   AGENT_API_URL = &quot;http://127.0.0.1:30120/agent_api/mcp&quot;</span></span>
<span class="line"><span>   AGENT_API_TOKEN = &quot;&lt;TOKEN&gt;&quot;</span></span>
<span class="line"><span>   \`\`\`</span></span>
<span class="line"><span></span></span>
<span class="line"><span>7. If the config file already exists:</span></span>
<span class="line"><span>   - Make an in-memory backup of the original bytes.</span></span>
<span class="line"><span>   - Parse it as TOML.</span></span>
<span class="line"><span>   - If \`[mcp_servers.agent_api]\` already exists, overwrite only the \`args\` path and the \`AGENT_API_TOKEN\` value. Leave any other settings (timeouts, sandbox flags) untouched.</span></span>
<span class="line"><span>   - If it does not exist, append the block above.</span></span>
<span class="line"><span>   - Preserve every other section in the file.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>8. Verify the file parses as valid TOML after the edit. If it fails to parse, restore from the backup and report the error.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>9. Print a summary:</span></span>
<span class="line"><span>   - REPO absolute path</span></span>
<span class="line"><span>   - the absolute path of the config file</span></span>
<span class="line"><span>   - whether the block was created or updated</span></span>
<span class="line"><span>   - the first 8 characters of the token (do NOT print the full token)</span></span>
<span class="line"><span>   - the absolute path of \`mcp-stdio.js\`</span></span>
<span class="line"><span></span></span>
<span class="line"><span>10. Tell me to restart any running Codex session for the new MCP server to load.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Do not modify any other files. Do not start any FiveM resources. Do not commit the change.</span></span></code></pre></div><p>The agent should respond with a one-screen summary; no follow-up is normally needed.</p><hr><h2 id="b-manual-install" tabindex="-1">B) Manual install <a class="header-anchor" href="#b-manual-install" aria-label="Permalink to &quot;B) Manual install&quot;">​</a></h2><ol><li><p>Make sure agent_api is running on your FiveM server and <code>dist/.agent_token</code> exists.</p></li><li><p>Open <code>~/.codex/config.toml</code> (or <code>%USERPROFILE%\\.codex\\config.toml</code> on Windows). Create it if missing.</p></li><li><p>Append:</p><div class="language-toml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">toml</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">[</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mcp_servers</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">agent_api</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">command = </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;node&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">args = [</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;C:/full/path/to/5m-mcp/dist/mcp-stdio.js&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">startup_timeout_ms = </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10000</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">[</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mcp_servers</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">agent_api</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">env</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">AGENT_API_URL = </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;http://127.0.0.1:30120/agent_api/mcp&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">AGENT_API_TOKEN = </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;paste-token-from-dist/.agent_token&quot;</span></span></code></pre></div></li><li><p>Restart Codex.</p></li><li><p>Smoke check: ask Codex <code>list MCP tools</code> — <code>agent_api</code> should appear with ~36 tools.</p></li></ol><hr><h2 id="notes" tabindex="-1">Notes <a class="header-anchor" href="#notes" aria-label="Permalink to &quot;Notes&quot;">​</a></h2><ul><li>The shim is a thin stdio↔HTTP bridge (~100 LOC, <code>src/bin/mcp-stdio.ts</code>). All real work runs in the FiveM resource.</li><li>If the token rotates (you deleted <code>dist/.agent_token</code> and restarted the resource), re-run the install prompt — it overwrites <code>AGENT_API_TOKEN</code>.</li><li>For Claude Code, use the HTTP transport block printed in the FiveM console on first start instead. The stdio shim is only needed for clients that don&#39;t speak HTTP MCP natively.</li></ul>`,14)])])}const k=a(t,[["render",i]]);export{m as __pageData,k as default};
