function readString(name: string, fallback: string): string {
  const v = GetConvar(name, '__missing__');
  return v === '__missing__' || v === '' ? fallback : v;
}

function readInt(name: string, fallback: number): number {
  return GetConvarInt(name, fallback);
}

function readBool(name: string, fallback: boolean): boolean {
  const v = GetConvar(name, fallback ? 'true' : 'false').toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function readCsv(name: string): string[] {
  return readString(name, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export type Convars = {
  rawToken: string;
  readonly: boolean;
  writeRoots: string[];
  controlRoots: string[];
  consoleBufferLines: number;
  maxFileBytes: number;
  ratePerMinute: number;
  testSessionTtlSeconds: number;
  testMaxSubjects: number;
};

export function loadConvars(): Convars {
  const defaultRoot = readString('agent_api_root', 'resources/[agent]');
  const extraWrite = readCsv('agent_api_allow_write_paths');
  const extraControl = readCsv('agent_api_allow_control_paths');

  return {
    rawToken: readString('agent_api_token', ''),
    readonly: readBool('agent_api_readonly', true),
    writeRoots: [defaultRoot, ...extraWrite],
    controlRoots: [defaultRoot, ...extraControl, ...extraWrite],
    consoleBufferLines: readInt('agent_api_console_buffer_lines', 2000),
    maxFileBytes: readInt('agent_api_max_file_bytes', 2 * 1024 * 1024),
    ratePerMinute: readInt('agent_api_rate_per_minute', 120),
    testSessionTtlSeconds: readInt('agent_api_test_session_ttl_seconds', 1800),
    testMaxSubjects: readInt('agent_api_test_max_subjects', 4),
  };
}
