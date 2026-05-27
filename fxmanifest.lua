fx_version 'cerulean'
game 'common'

author 'agent'
description 'Local MCP tool surface for agentic FiveM resource development'
version '0.5.0'

server_scripts {
  'dist/server.js',
}

client_scripts {
  'dist/client.js',
}

files {
  'dist/.agent_token',
}

convar_category 'agent_api' {
  'agent_api',
  {
    { 'Token (blank = auto-generate)', 'agent_api_token',                  'CV_STRING', '' },
    { 'Read-only mode',                'agent_api_readonly',               'CV_BOOL',   'false' },
    { 'Default write root',            'agent_api_root',                   'CV_STRING', 'resources/[agent]' },
    { 'Extra write roots (csv)',       'agent_api_allow_write_paths',      'CV_STRING', '' },
    { 'Extra control roots (csv)',     'agent_api_allow_control_paths',    'CV_STRING', '' },
    { 'Console buffer lines',          'agent_api_console_buffer_lines',   'CV_INT',    '2000' },
    { 'Max file bytes',                'agent_api_max_file_bytes',         'CV_INT',    '2097152' },
    { 'Rate per minute',               'agent_api_rate_per_minute',        'CV_INT',    '120' },
    { 'Test session TTL seconds',      'agent_api_test_session_ttl_seconds', 'CV_INT',  '1800' },
    { 'Max active test subjects',      'agent_api_test_max_subjects',      'CV_INT',    '4' },
  },
}
