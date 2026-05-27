import { computed, reactive, ref } from 'vue';
import type { PermDescriptor, PermValues } from '../../shared/types';
import { permissionsApi } from './permissions.api';

export function usePermissions() {
  const descriptors = ref<PermDescriptor[]>([]);
  const values = ref<PermValues>({});
  const draft = reactive<PermValues>({});
  const loading = ref(true);

  const groups = computed(() => {
    const out: Record<string, PermDescriptor[]> = {};
    for (const d of descriptors.value) (out[d.group] ??= []).push(d);
    return out;
  });

  const dirty = computed(() => Object.keys(draft).length > 0);

  function current(convar: string): string {
    return draft[convar] ?? values.value[convar] ?? '';
  }

  function stage(convar: string, value: string): void {
    draft[convar] = value;
  }

  async function load(): Promise<void> {
    loading.value = true;
    const { data } = await permissionsApi.list();
    descriptors.value = data.descriptors ?? [];
    values.value = data.values ?? {};
    for (const k of Object.keys(draft)) delete draft[k];
    loading.value = false;
  }

  async function save(): Promise<{ ok: boolean; error?: string }> {
    const { ok, data } = await permissionsApi.save({ ...draft });
    if (ok && data.values) {
      values.value = data.values;
      for (const k of Object.keys(draft)) delete draft[k];
      return { ok: true };
    }
    return { ok: false, error: data.error ?? 'Failed to save.' };
  }

  return { descriptors, values, draft, groups, dirty, loading, current, stage, load, save };
}
