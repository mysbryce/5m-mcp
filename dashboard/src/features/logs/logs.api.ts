import { request } from '../../shared/http';
import type { AuditEntry, ConsoleLine } from '../../shared/types';

export const logsApi = {
  // No sinceTs → most recent 300 (initial). With sinceTs → only newer lines.
  console: (sinceTs?: number) =>
    request<{ lines: ConsoleLine[] }>('/console', 'POST', sinceTs !== undefined ? { sinceTs } : {}),
  audit: () => request<{ entries: AuditEntry[] }>('/audit'),
};
