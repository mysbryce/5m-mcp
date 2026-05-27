import { readonly, ref } from 'vue';
import { session } from '../../shared/session';
import type { PublicUser } from '../../shared/types';
import { authApi } from './auth.api';

// Module-level singleton state — shared across every component that calls useAuth().
const me = ref<PublicUser | null>(null);
const signupOpen = ref(false);
const ready = ref(false);

async function boot(): Promise<void> {
  const state = await authApi.state();
  signupOpen.value = state.data.signupOpen;

  if (session.get()) {
    const res = await authApi.me();
    if (res.ok) {
      me.value = res.data.user;
      ready.value = true;
      return;
    }
    session.clear();
  }
  me.value = null;
  ready.value = true;
}

async function authenticate(
  mode: 'login' | 'signup',
  username: string,
  password: string,
): Promise<string | null> {
  const call = mode === 'signup' ? authApi.signup : authApi.login;
  const { ok, data } = await call(username.trim(), password);
  if (ok && data.token && data.user) {
    session.set(data.token);
    me.value = data.user;
    return null;
  }
  return data.error ?? 'Authentication failed.';
}

async function logout(): Promise<void> {
  await authApi.logout();
  session.clear();
  me.value = null;
  await boot();
}

export function useAuth() {
  return {
    me: readonly(me),
    signupOpen: readonly(signupOpen),
    ready: readonly(ready),
    boot,
    authenticate,
    logout,
  };
}
