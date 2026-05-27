import { request } from '../../shared/http';
import type { PublicUser, Role } from '../../shared/types';

export const usersApi = {
  list: () => request<{ users: PublicUser[] }>('/users'),
  create: (username: string, password: string, role: Role) =>
    request<{ user?: PublicUser; error?: string }>('/users', 'POST', { username, password, role }),
  remove: (id: string) => request<{ ok?: boolean; error?: string }>(`/users/${id}`, 'DELETE'),
};
