import { ref } from 'vue';
import type { CustomSkill, TriggerCatalog } from '../../shared/types';
import { skillsApi } from './skills.api';

export function useSkills() {
  const items = ref<CustomSkill[]>([]);
  const catalog = ref<TriggerCatalog>({ tools: [], categories: [] });
  const loading = ref(true);

  async function load(): Promise<void> {
    loading.value = true;
    const [list, triggers] = await Promise.all([skillsApi.list(), skillsApi.triggers()]);
    items.value = list.data.skills ?? [];
    catalog.value = {
      tools: triggers.data.tools ?? [],
      categories: triggers.data.categories ?? [],
    };
    loading.value = false;
  }

  async function save(s: Partial<CustomSkill>): Promise<{ ok: boolean; error?: string }> {
    const { ok, data } = await skillsApi.save(s);
    if (ok) {
      await load();
      return { ok: true };
    }
    return { ok: false, error: data.error ?? 'Failed to save.' };
  }

  async function remove(id: string): Promise<void> {
    await skillsApi.remove(id);
    await load();
  }

  async function toggle(s: CustomSkill): Promise<void> {
    await save({
      id: s.id,
      name: s.name,
      description: s.description,
      body: s.body,
      triggers: s.triggers,
      enabled: !s.enabled,
    });
  }

  return { items, catalog, loading, load, save, remove, toggle };
}
