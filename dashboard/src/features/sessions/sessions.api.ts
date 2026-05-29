import { request } from '../../shared/http';
import type { FileNode, WorkRequest, WorkSession } from '../../shared/types';

export const sessionsApi = {
  list: () => request<{ sessions: WorkSession[] }>('/tasks'),
  remove: (resource: string) =>
    request<{ ok?: boolean; error?: string }>(`/tasks/${resource}`, 'DELETE'),
  tree: (resource: string, sub = '') =>
    request<{ tree?: FileNode[]; truncated?: boolean; error?: string }>('/fs/tree', 'POST', {
      resource,
      sub,
    }),
  listRequests: () => request<{ requests: WorkRequest[] }>('/requests'),
  createRequest: (resource: string, path: string | null, prompt: string) =>
    request<{ request?: WorkRequest; error?: string }>('/requests', 'POST', {
      resource,
      path,
      prompt,
    }),
};
