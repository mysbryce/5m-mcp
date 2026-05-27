import { request } from '../../shared/http';
import type { PermDescriptor, PermValues } from '../../shared/types';

export const permissionsApi = {
  list: () => request<{ descriptors: PermDescriptor[]; values: PermValues }>('/permissions'),
  save: (updates: PermValues) =>
    request<{ values?: PermValues; error?: string }>('/permissions', 'POST', { updates }),
};
