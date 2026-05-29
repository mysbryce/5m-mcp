<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import StatusMessage from '../../shared/ui/StatusMessage.vue';
import FileTreeNode from './FileTreeNode.vue';
import { useSessions } from './useSessions';
import { useI18n } from '../../i18n/useI18n';

const {
  sessions,
  loading,
  selected,
  current,
  tree,
  treeTruncated,
  treeLoading,
  requestsFor,
  load,
  select,
  sendRequest,
  remove,
} = useSessions();
const { t } = useI18n();

// --- prompt modal ---
const modalOpen = ref(false);
const modalPath = ref<string | null>(null);
const modalPrompt = ref('');
const modalError = ref('');
const sending = ref(false);

function openModal(path: string | null): void {
  modalPath.value = path;
  modalPrompt.value = '';
  modalError.value = '';
  modalOpen.value = true;
}

function closeModal(): void {
  modalOpen.value = false;
}

async function submitPrompt(): Promise<void> {
  if (!current.value || !modalPrompt.value.trim()) {
    modalError.value = t('sessions.promptRequired');
    return;
  }
  sending.value = true;
  const res = await sendRequest(current.value.resource, modalPath.value, modalPrompt.value.trim());
  sending.value = false;
  if (res.ok) closeModal();
  else modalError.value = res.error ?? t('sessions.sendFailed');
}

function todoGlyph(status: string): string {
  if (status === 'done') return '✓';
  if (status === 'in_progress') return '▶';
  return '○';
}

let timer: number | undefined;
onMounted(() => {
  load();
  timer = window.setInterval(load, 5000);
});
onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <section class="sessions">
    <header class="head">
      <div>
        <h2>{{ t('sessions.title') }}</h2>
        <p class="sub">{{ t('sessions.sub') }}</p>
      </div>
      <UiButton @click="load">{{ t('sessions.refresh') }}</UiButton>
    </header>

    <div v-if="loading && !sessions.length" class="empty">{{ t('common.loading') }}</div>
    <div v-else-if="!sessions.length" class="empty">{{ t('sessions.none') }}</div>

    <div v-else class="layout">
      <!-- session list -->
      <aside class="list">
        <button
          v-for="s in sessions"
          :key="s.resource"
          class="item"
          :class="{ active: s.resource === selected }"
          @click="select(s.resource)"
        >
          <span class="name">{{ s.resource }}</span>
          <span class="meta">
            <span v-if="requestsFor(s.resource).some((r) => r.status === 'pending')" class="dot" />
            {{ s.todos.filter((x) => x.status === 'done').length }}/{{ s.todos.length }}
          </span>
        </button>
      </aside>

      <!-- detail -->
      <div v-if="current" class="detail">
        <div class="block">
          <div class="block-head">
            <h3>{{ current.resource }}</h3>
            <div class="actions">
              <UiButton @click="openModal(null)">{{ t('sessions.askResource') }}</UiButton>
              <button class="del" @click="remove(current.resource)">{{ t('sessions.remove') }}</button>
            </div>
          </div>
          <p class="current">
            <span class="lbl">{{ t('sessions.currentTask') }}:</span>
            {{ current.currentTask || '—' }}
          </p>
        </div>

        <!-- todos -->
        <div class="block">
          <h4>{{ t('sessions.todos') }}</h4>
          <ul v-if="current.todos.length" class="todos">
            <li v-for="(todo, i) in current.todos" :key="i" :class="todo.status">
              <span class="tg">{{ todoGlyph(todo.status) }}</span>{{ todo.text }}
            </li>
          </ul>
          <p v-else class="muted">{{ t('sessions.noTodos') }}</p>
        </div>

        <!-- pending requests -->
        <div v-if="requestsFor(current.resource).length" class="block">
          <h4>{{ t('sessions.requests') }}</h4>
          <ul class="reqs">
            <li v-for="r in requestsFor(current.resource)" :key="r.id" :class="r.status">
              <span class="badge" :class="r.status">{{ r.status }}</span>
              <code v-if="r.path">{{ r.path }}</code>
              <code v-else class="whole">({{ t('sessions.wholeResource') }})</code>
              <span class="prompt">{{ r.prompt }}</span>
            </li>
          </ul>
        </div>

        <!-- file tree -->
        <div class="block">
          <h4>{{ t('sessions.files') }}</h4>
          <p v-if="treeLoading" class="muted">{{ t('common.loading') }}</p>
          <div v-else-if="tree.length" class="tree">
            <FileTreeNode
              v-for="n in tree"
              :key="n.name"
              :node="n"
              :path="n.name"
              @pick="(p) => openModal(p)"
            />
            <p v-if="treeTruncated" class="muted trunc">{{ t('sessions.treeTruncated') }}</p>
          </div>
          <p v-else class="muted">{{ t('sessions.noFiles') }}</p>
        </div>
      </div>
    </div>

    <!-- prompt modal -->
    <div v-if="modalOpen" class="overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ t('sessions.askTitle') }}</h3>
        <p class="target">
          <span class="lbl">{{ t('sessions.target') }}:</span>
          <code>{{ current?.resource }}{{ modalPath ? '/' + modalPath : ' (' + t('sessions.wholeResource') + ')' }}</code>
        </p>
        <textarea
          v-model="modalPrompt"
          rows="5"
          :placeholder="t('sessions.promptPlaceholder')"
        ></textarea>
        <StatusMessage v-if="modalError" :text="modalError" tone="error" />
        <div class="modal-actions">
          <button class="ghost" @click="closeModal">{{ t('sessions.cancel') }}</button>
          <UiButton :disabled="sending" @click="submitPrompt">
            {{ sending ? t('sessions.sending') : t('sessions.send') }}
          </UiButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
h2 {
  margin: 0;
}
.sub {
  color: var(--muted);
  margin: 4px 0 0;
  font-size: 13px;
}
.empty {
  color: var(--muted);
  padding: 40px;
  text-align: center;
}
.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  color: var(--fg);
  text-align: left;
  font-size: 14px;
}
.item:hover {
  background: var(--surface, rgba(255, 255, 255, 0.04));
}
.item.active {
  border-color: var(--primary);
  background: var(--surface, rgba(255, 255, 255, 0.06));
}
.item .name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item .meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  flex-shrink: 0;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
}
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.block {
  background: var(--surface, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
}
.block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.block h3,
.block h4 {
  margin: 0 0 8px;
}
.block h4 {
  font-size: 13px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.del,
.ghost {
  background: none;
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: 7px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
}
.del:hover {
  color: #ff6b6b;
  border-color: #ff6b6b;
}
.current {
  margin: 0;
  font-size: 14px;
}
.lbl {
  color: var(--muted);
}
.todos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.todos li {
  font-size: 14px;
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.todos .tg {
  color: var(--muted);
  width: 14px;
}
.todos li.done {
  color: var(--muted);
  text-decoration: line-through;
}
.todos li.in_progress {
  color: var(--fg);
  font-weight: 600;
}
.todos li.in_progress .tg {
  color: var(--primary);
}
.reqs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reqs li {
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.reqs li.done {
  opacity: 0.55;
}
.badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 10px;
  border: 1px solid var(--border);
}
.badge.pending {
  color: var(--primary);
  border-color: var(--primary);
}
.reqs code,
.target code {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.25);
  padding: 1px 5px;
  border-radius: 4px;
}
.reqs .whole {
  color: var(--muted);
}
.reqs .prompt {
  flex-basis: 100%;
  color: var(--muted);
}
.tree {
  max-height: 380px;
  overflow: auto;
}
.trunc {
  margin-top: 8px;
}
.muted {
  color: var(--muted);
  font-size: 13px;
  margin: 0;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  z-index: 50;
}
.modal {
  background: var(--bg, #1c1c22);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 22px;
  width: min(560px, 92vw);
}
.modal h3 {
  margin: 0 0 10px;
}
.target {
  font-size: 13px;
  margin: 0 0 12px;
}
.modal textarea {
  width: 100%;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  font-family: var(--mono, monospace);
  font-size: 13px;
  padding: 10px;
  resize: vertical;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
