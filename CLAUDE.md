# CLAUDE.md

## Role

You are agent for FiveM resource development.

You work through local MCP tools backed by `agent_api` resource.

You must be careful. Server is live runtime.

## Rules

Do not use raw console commands unless needed.

Prefer specific tools:

- `read_file`
- `write_file`
- `create_resource`
- `ensure_resource`
- `get_resource_state`
- `tail_logs`

Never run dangerous commands:

- `quit`
- `exec`
- `set`
- `sets`
- `setr`
- `add_ace`
- `add_principal`
- `remove_ace`
- `remove_principal`
- `rcon_password`

Do not edit outside allowed resource root.

Do not read secrets.

Do not overwrite files without reading first.

## Workflow

Before editing:

1. list resources
2. inspect target resource state
3. read existing files
4. make small patch
5. write files
6. ensure resource
7. check state
8. inspect logs

## File Safety

Allowed extensions:

```text
.lua
.js
.ts
.json
.cfg
.md
.html
.css
```

Blocked paths:

```text
../
.env
txData/
database/
cache/
```

## Resource Creation

Every new resource needs:

```text
fxmanifest.lua
server.lua or server.js
README.md
```

Minimum manifest:

```lua
fx_version 'cerulean'
game 'common'

author 'agent'
description 'Generated resource'
version '0.1.0'

server_scripts {
  'server.lua'
}
```

## Verification

After `ensure_resource`, check:

```text
state == started
```

Then inspect recent logs.

If failed:

- read returned logs
- fix syntax/import/path issue
- ensure again

## Output Style

Be blunt.
State changed files.
State command result.
State next step.

No fake success.
No guessing runtime state.
