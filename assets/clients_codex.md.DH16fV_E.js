import{c as a,Q as n,j as p,m as e}from"./chunks/framework.CTNaDwNv.js";const k=JSON.parse('{"title":"Codex CLI","description":"","frontmatter":{},"headers":[],"relativePath":"clients/codex.md","filePath":"clients/codex.md","lastUpdated":1779853631000}'),i={name:"clients/codex.md"};function t(l,s,o,c,d,r){return n(),p("div",null,[...s[0]||(s[0]=[e(`<h1 id="codex-cli" tabindex="-1">Codex CLI <a class="header-anchor" href="#codex-cli" aria-label="Permalink to &quot;Codex CLI&quot;">​</a></h1><p>Codex CLI (OpenAI) supports stdio MCP servers. Use the bundled shim.</p><h2 id="auto-install-via-codex-itself" tabindex="-1">Auto-install via Codex itself <a class="header-anchor" href="#auto-install-via-codex-itself" aria-label="Permalink to &quot;Auto-install via Codex itself&quot;">​</a></h2><p>Open Codex in any directory and paste the prompt below. Codex will discover the repo on its own and wire <code>~/.codex/config.toml</code> for you.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Install the \`agent_api\` MCP server into my Codex configuration.</span></span>
<span class="line"><span></span></span>
<span class="line"><span># Inputs</span></span>
<span class="line"><span>- AGENT_API_REPO: leave blank — discover automatically (see step 1).</span></span>
<span class="line"><span>- AGENT_API_URL : default \`http://127.0.0.1:30120/agent_api/mcp\` unless I told you otherwise.</span></span>
<span class="line"><span></span></span>
<span class="line"><span># Steps (stop on first failure)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. Locate the agent_api repo (must contain \`dist/mcp-stdio.js\` and</span></span>
<span class="line"><span>   \`dist/.agent_token\`). Try, in order:</span></span>
<span class="line"><span>   a. cwd, walk up 5 levels</span></span>
<span class="line"><span>   b. Windows: D:/Sure/5m-mcp, C:/dev/5m-mcp, %USERPROFILE%/5m-mcp,</span></span>
<span class="line"><span>      %USERPROFILE%/dev/5m-mcp, %USERPROFILE%/Documents/5m-mcp</span></span>
<span class="line"><span>      macOS/Linux: ~/5m-mcp, ~/dev/5m-mcp, ~/projects/5m-mcp,</span></span>
<span class="line"><span>      ~/src/5m-mcp, ~/code/5m-mcp</span></span>
<span class="line"><span>   c. \`git rev-parse --show-toplevel\` if cwd is in a clone</span></span>
<span class="line"><span>   d. ask me as a last resort.</span></span>
<span class="line"><span>   Save the absolute path as REPO.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>2. Verify REPO/dist/.agent_token. If missing, stop and tell me to start</span></span>
<span class="line"><span>   the FiveM server with agent_api once.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>3. Read the token (trim whitespace).</span></span>
<span class="line"><span></span></span>
<span class="line"><span>4. Resolve REPO/dist/mcp-stdio.js. If missing, run \`npm run build\` in REPO.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>5. Resolve the Codex config path:</span></span>
<span class="line"><span>   Windows: %USERPROFILE%\\.codex\\config.toml</span></span>
<span class="line"><span>   macOS/Linux: ~/.codex/config.toml</span></span>
<span class="line"><span>   Create the parent directory if missing.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>6. If the file is missing, create it with:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>   \`\`\`toml</span></span>
<span class="line"><span>   [mcp_servers.agent_api]</span></span>
<span class="line"><span>   command = &quot;node&quot;</span></span>
<span class="line"><span>   args = [&quot;&lt;abs path to dist/mcp-stdio.js&gt;&quot;]</span></span>
<span class="line"><span>   startup_timeout_ms = 10000</span></span>
<span class="line"><span>   [mcp_servers.agent_api.env]</span></span>
<span class="line"><span>   AGENT_API_URL = &quot;http://127.0.0.1:30120/agent_api/mcp&quot;</span></span>
<span class="line"><span>   AGENT_API_TOKEN = &quot;&lt;token&gt;&quot;</span></span>
<span class="line"><span>   \`\`\`</span></span>
<span class="line"><span></span></span>
<span class="line"><span>7. If it exists: parse as TOML, in-memory backup, then either overwrite</span></span>
<span class="line"><span>   the agent_api block&#39;s args + token (leave other settings) or append it.</span></span>
<span class="line"><span>   Preserve every other section.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>8. Validate the file parses. If not, restore the backup.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>9. Print a summary: REPO, config path, token&#39;s first 8 chars only,</span></span>
<span class="line"><span>   mcp-stdio.js path.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>10. Tell me to restart Codex.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Do not modify other files. Do not start FiveM. Do not commit.</span></span></code></pre></div><h2 id="manual-install" tabindex="-1">Manual install <a class="header-anchor" href="#manual-install" aria-label="Permalink to &quot;Manual install&quot;">​</a></h2><p>Edit <code>~/.codex/config.toml</code> (Windows: <code>%USERPROFILE%\\.codex\\config.toml</code>):</p><div class="language-toml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">toml</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">[</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mcp_servers</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">agent_api</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">command = </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;node&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">args = [</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;C:/full/path/to/5m-mcp/dist/mcp-stdio.js&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">startup_timeout_ms = </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10000</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">[</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">mcp_servers</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">agent_api</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">env</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">AGENT_API_URL = </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;http://127.0.0.1:30120/agent_api/mcp&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">AGENT_API_TOKEN = </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;paste-token-here&quot;</span></span></code></pre></div><p>Restart Codex. Ask &quot;list MCP tools&quot; — <code>agent_api</code> should appear.</p>`,9)])])}const m=a(i,[["render",t]]);export{k as __pageData,m as default};
