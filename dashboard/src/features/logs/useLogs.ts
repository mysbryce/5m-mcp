import { ref } from 'vue';
import type { AuditEntry, ConsoleLine } from '../../shared/types';
import { logsApi } from './logs.api';

const MAX_LINES = 1500;

export function useLogs() {
  const lines = ref<ConsoleLine[]>([]);
  const entries = ref<AuditEntry[]>([]);
  const loadingAudit = ref(true);
  let lastTs = 0;

  async function initConsole(): Promise<void> {
    const { data } = await logsApi.console();
    lines.value = data.lines ?? [];
    const last = lines.value[lines.value.length - 1];
    lastTs = last ? last.ts : Date.now();
  }

  async function pollConsole(): Promise<void> {
    const { data } = await logsApi.console(lastTs);
    const fresh = data.lines ?? [];
    if (fresh.length === 0) return;
    lines.value = [...lines.value, ...fresh].slice(-MAX_LINES);
    lastTs = fresh[fresh.length - 1]!.ts;
  }

  async function loadAudit(): Promise<void> {
    loadingAudit.value = true;
    const { data } = await logsApi.audit();
    entries.value = data.entries ?? [];
    loadingAudit.value = false;
  }

  return { lines, entries, loadingAudit, initConsole, pollConsole, loadAudit };
}
