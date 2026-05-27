import { ref } from 'vue';
import type { AuditEntry, ConsoleLine } from '../../shared/types';
import { logsApi } from './logs.api';

export function useLogs() {
  const lines = ref<ConsoleLine[]>([]);
  const entries = ref<AuditEntry[]>([]);
  const loading = ref(true);

  async function load(): Promise<void> {
    loading.value = true;
    const [c, a] = await Promise.all([logsApi.console(), logsApi.audit()]);
    lines.value = c.data.lines ?? [];
    entries.value = a.data.entries ?? [];
    loading.value = false;
  }

  return { lines, entries, loading, load };
}
