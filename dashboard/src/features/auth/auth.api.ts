import { request } from '../../shared/http';
import type { PublicUser } from '../../shared/types';

export interface AuthState {
  signupOpen: boolean;
  userCount: number;
}

interface AuthPayload {
  token?: string;
  user?: PublicUser;
  error?: string;
}

export const authApi = {
  state: () => request<AuthState>('/auth/state'),
  me: () => request<{ user: PublicUser }>('/auth/me'),
  login: (username: string, password: string) =>
    request<AuthPayload>('/auth/login', 'POST', { username, password }),
  signup: (username: string, password: string) =>
    request<AuthPayload>('/auth/signup', 'POST', { username, password }),
  logout: () => request<{ ok: boolean }>('/auth/logout', 'POST'),
};
