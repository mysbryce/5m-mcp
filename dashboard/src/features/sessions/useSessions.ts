import { computed, ref } from 'vue';
import type { FileNode, WorkRequest, WorkSession } from '../../shared/types';
import { sessionsApi } from './sessions.api';

export function useSessions() {
  const sessions = ref<WorkSession[]>([]);
  const requests = ref<WorkRequest[]>([]);
  const loading = ref(true);
  const selected = ref<string | null>(null);
  const tree = ref<FileNode[]>([]);
  const treeTruncated = ref(false);
  const treeLoading = ref(false);

  const current = computed(() => sessions.value.find((s) => s.resource === selected.value) ?? null);
  const pending = computed(() => requests.value.filter((r) => r.status === 'pending'));

  function requestsFor(resource: string): WorkRequest[] {
    return requests.value.filter((r) => r.resource === resource);
  }

  async function load(): Promise<void> {
    loading.value = true;
    const [s, r] = await Promise.all([sessionsApi.list(), sessionsApi.listRequests()]);
    sessions.value = s.data.sessions ?? [];
    requests.value = r.data.requests ?? [];
    if (!selected.value && sessions.value.length) {
      await select(sessions.value[0]!.resource);
    } else if (selected.value && !sessions.value.some((x) => x.resource === selected.value)) {
      selected.value = null;
      tree.value = [];
    }
    loading.value = false;
  }

  async function select(resource: string): Promise<void> {
    selected.value = resource;
    treeLoading.value = true;
    tree.value = [];
    treeTruncated.value = false;
    const res = await sessionsApi.tree(resource);
    tree.value = res.data.tree ?? [];
    treeTruncated.value = res.data.truncated ?? false;
    treeLoading.value = false;
  }

  async function refreshRequests(): Promise<void> {
    const r = await sessionsApi.listRequests();
    requests.value = r.data.requests ?? [];
  }

  async function sendRequest(
    resource: string,
    path: string | null,
    prompt: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const { ok, data } = await sessionsApi.createRequest(resource, path, prompt);
    if (ok) {
      await refreshRequests();
      return { ok: true };
    }
    return { ok: false, error: data.error ?? 'Failed to send request.' };
  }

  async function remove(resource: string): Promise<void> {
    await sessionsApi.remove(resource);
    if (selected.value === resource) {
      selected.value = null;
      tree.value = [];
    }
    await load();
  }

  return {
    sessions,
    requests,
    loading,
    selected,
    current,
    pending,
    tree,
    treeTruncated,
    treeLoading,
    requestsFor,
    load,
    select,
    sendRequest,
    refreshRequests,
    remove,
  };
}
