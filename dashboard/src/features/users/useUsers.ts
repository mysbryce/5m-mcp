import { ref } from 'vue';
import type { PublicUser, Role } from '../../shared/types';
import { usersApi } from './users.api';

export function useUsers() {
  const users = ref<PublicUser[]>([]);
  const loading = ref(true);

  async function load(): Promise<void> {
    loading.value = true;
    const { data } = await usersApi.list();
    users.value = data.users ?? [];
    loading.value = false;
  }

  async function create(
    username: string,
    password: string,
    role: Role,
  ): Promise<{ ok: boolean; error?: string }> {
    const { ok, data } = await usersApi.create(username.trim(), password, role);
    if (ok) {
      await load();
      return { ok: true };
    }
    return { ok: false, error: data.error ?? 'Failed to add user.' };
  }

  async function remove(id: string): Promise<void> {
    await usersApi.remove(id);
    await load();
  }

  return { users, loading, load, create, remove };
}
