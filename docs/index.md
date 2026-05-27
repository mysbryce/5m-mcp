---
layout: home

hero:
  name: agent_api
  text: An MCP server for FiveM
  tagline: Let any MCP-aware agent develop, debug, and live-test FiveM resources against a running server.
  actions:
    - theme: brand
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/mysbryce/5m-mcp

features:
  - title: One drop-in FiveM resource
    details: No external sidecar. Drop the folder into <code>resources/[agent]/</code>, <code>ensure&nbsp;agent_api</code>, paste the printed MCP config into your client. Ready.
  - title: 36+ tools out of the box
    details: Filesystem (sandbox-guarded), resource lifecycle, console capture, live-player probes, dynamic client + server natives, allowlisted shell, NUI screenshots.
  - title: Framework bridges
    details: ESX, ox_lib, oxmysql plugins auto-detect on boot. Reflective dispatchers expose every method of each framework with a readonly verb gate.
  - title: Speaks real MCP
    details: HTTP transport for Claude Code, Cursor, and any spec-compliant client. Bundled stdio shim for clients that need stdin/stdout.
  - title: Grill workflow for scaffolding
    details: <code>scaffold_fivem_resource_workflow</code> tool + matching MCP prompt force a structured Q&amp;A before any file is written. Vite UI, ox_lib modules, config split — all asked, never assumed.
  - title: Built for safety on a live server
    details: Token bootstrap, per-resource locks, readonly mode, blocklists for dangerous natives, ACE-aware lifecycle, audit log of every action. Self-targeting lifecycle commands are hard-refused.
---
