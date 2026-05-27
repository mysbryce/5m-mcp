const KEY = 'agent_api_session';

export const session = {
  get(): string {
    return localStorage.getItem(KEY) ?? '';
  },
  set(token: string): void {
    localStorage.setItem(KEY, token);
  },
  clear(): void {
    localStorage.removeItem(KEY);
  },
};
