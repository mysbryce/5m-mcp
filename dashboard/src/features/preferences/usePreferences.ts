import { ref } from 'vue';
import type { Preference } from '../../shared/types';
import { preferencesApi } from './preferences.api';

export function usePreferences() {
  const items = ref<Preference[]>([]);
  const loading = ref(true);

  async function load(): Promise<void> {
    loading.value = true;
    const { data } = await preferencesApi.list();
    items.value = data.preferences ?? [];
    loading.value = false;
  }

  async function save(p: Partial<Preference>): Promise<{ ok: boolean; error?: string }> {
    const { ok, data } = await preferencesApi.save(p);
    if (ok) {
      await load();
      return { ok: true };
    }
    return { ok: false, error: data.error ?? 'Failed to save.' };
  }

  async function remove(id: string): Promise<void> {
    await preferencesApi.remove(id);
    await load();
  }

  async function toggle(p: Preference): Promise<void> {
    await save({
      id: p.id,
      type: p.type,
      description: p.description,
      exampleResource: p.exampleResource,
      examplePath: p.examplePath,
      enabled: !p.enabled,
    });
  }

  return { items, loading, load, save, remove, toggle };
}
