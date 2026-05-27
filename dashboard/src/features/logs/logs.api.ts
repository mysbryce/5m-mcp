import { request } from '../../shared/http';
import type { AuditEntry, ConsoleLine } from '../../shared/types';

export const logsApi = {
  console: () => request<{ lines: ConsoleLine[] }>('/console'),
  audit: () => request<{ entries: AuditEntry[] }>('/audit'),
};
