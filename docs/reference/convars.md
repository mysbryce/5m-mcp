# Convars

A flat reference of every convar `agent_api` reads. For organised explanations see [Configuration](/guide/configuration).

## Index

| Convar | Default | Notes |
| --- | --- | --- |
| `agent_api_token` | `""` | blank = auto-generate to `dist/.agent_token` |
| `agent_api_readonly` | `false` | one switch closes every mutator |
| `agent_api_root` | `resources/[agent]` | primary write+control root |
| `agent_api_allow_write_paths` | `""` | csv |
| `agent_api_allow_control_paths` | `""` | csv |
| `agent_api_console_buffer_lines` | `2000` | size of ring buffer |
| `agent_api_max_file_bytes` | `2097152` | hard cap on read/write |
| `agent_api_extra_write_extensions` | `""` | csv, extra writable extensions |
| `agent_api_rate_per_minute` | `120` | per-token-hash bucket |
| `agent_api_test_session_ttl_seconds` | `1800` | opt-in TTL |
| `agent_api_test_max_subjects` | `4` | active subject pool size |
| `agent_api_client_blocked_natives` | `""` | csv, names refused by `client_call_native` |
| `agent_api_server_blocked_natives` | `""` | csv, additional to built-in danger list |
| `agent_api_shell_allowed_commands` | (default list) | csv. If set, REPLACES the default |
| `agent_api_node_binary` | `node` | used by `screenshot_nui` to spawn the helper |
| `agent_api_plugin_esx_enabled` | `auto` | auto / true / false |
| `agent_api_plugin_oxlib_enabled` | `auto` | auto / true / false |
| `agent_api_plugin_oxmysql_enabled` | `auto` | auto / true / false |
| `agent_api_plugin_esx_blocked_methods` | `""` | csv |
| `agent_api_plugin_oxlib_blocked_methods` | `""` | csv |
| `agent_api_plugin_oxmysql_readonly` | `true` | SELECT-only when true |
| `agent_api_plugin_oxmysql_allow_statements` | `SELECT` | csv, uppercase verbs |

## Default shell allowlist

```
npm,npx,pnpm,yarn,bun,vite,git,node
```

## Built-in server-native danger list (always refused)

```
DropPlayer, ExecuteCommand, StopResource, StartResource,
ScheduleResourceTick, PrintStructuredTrace, CancelEvent,
TempBanPlayer, BanPlayer
```
