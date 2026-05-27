import { request } from '../../shared/http';
import type { BrowseResource, Preference } from '../../shared/types';

export const preferencesApi = {
  list: () => request<{ preferences: Preference[] }>('/preferences'),
  save: (p: Partial<Preference>) =>
    request<{ preference?: Preference; error?: string }>('/preferences', 'POST', p),
  remove: (id: string) =>
    request<{ ok?: boolean; error?: string }>(`/preferences/${id}`, 'DELETE'),
  resources: () => request<{ resources: BrowseResource[] }>('/fs/resources'),
  listDirs: (resource: string, sub: string) =>
    request<{ dirs?: string[]; sub?: string; error?: string }>('/fs/list', 'POST', {
      resource,
      sub,
    }),
};
