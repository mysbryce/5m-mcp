<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import UiSelect from '../../shared/ui/UiSelect.vue';
import UiToggle from '../../shared/ui/UiToggle.vue';
import UiField from '../../shared/ui/UiField.vue';
import StatusMessage from '../../shared/ui/StatusMessage.vue';
import FolderBrowser from './FolderBrowser.vue';
import { usePreferences } from './usePreferences';
import type { Preference, PreferenceType } from '../../shared/types';
import { useI18n } from '../../i18n/useI18n';

const { items, loading, load, save, remove, toggle } = usePreferences();
const { t } = useI18n();

const editingId = ref<string | null>(null);
const showForm = ref(false);
const type = ref<PreferenceType>('structure');
const description = ref('');
const exResource = ref('');
const exPath = ref('');
const error = ref('');

const typeOptions = computed(() => [
  { value: 'structure', label: t('pref.typeStructure') },
  { value: 'coding', label: t('pref.typeCoding') },
  { value: 'ui-design', label: t('pref.typeUi') },
]);
const typeModel = computed({
  get: () => type.value as string,
  set: (v: string) => {
    type.value = v as PreferenceType;
  },
});

function typeLabel(tp: PreferenceType): string {
  return tp === 'structure'
    ? t('pref.typeStructure')
    : tp === 'coding'
      ? t('pref.typeCoding')
      : t('pref.typeUi');
}

function reset(): void {
  editingId.value = null;
  showForm.value = false;
  type.value = 'structure';
  description.value = '';
  exResource.value = '';
  exPath.value = '';
  error.value = '';
}

function openAdd(): void {
  reset();
  showForm.value = true;
}

function openEdit(p: Preference): void {
  editingId.value = p.id;
  type.value = p.type;
  description.value = p.description;
  exResource.value = p.exampleResource ?? '';
  exPath.value = p.examplePath ?? '';
  error.value = '';
  showForm.value = true;
}

async function onSave(): Promise<void> {
  error.value = '';
  const result = await save({
    id: editingId.value ?? undefined,
    type: type.value,
    description: description.value,
    exampleResource: exResource.value || undefined,
    examplePath: exPath.value || undefined,
    enabled: true,
  });
  if (result.ok) reset();
  else error.value = result.error ?? t('pref.failed');
}

async function onRemove(p: Preference): Promise<void> {
  if (!confirm(t('pref.confirmRemove'))) return;
  await remove(p.id);
}

onMounted(load);
</script>

<template>
  <section>
    <div class="section-title">{{ t('pref.title') }}</div>
    <div class="section-sub">{{ t('pref.sub') }}</div>

    <p v-if="loading" class="muted">{{ t('common.loading') }}</p>

    <template v-else>
      <div v-if="items.length" class="card list">
        <div v-for="p in items" :key="p.id" class="row">
          <div class="meta">
            <div class="top">
              <span class="badge" :class="p.type">{{ typeLabel(p.type) }}</span>
              <span v-if="p.exampleResource" class="folder">
                {{ p.exampleResource }}/{{ p.examplePath }}
              </span>
            </div>
            <div class="desc">{{ p.description }}</div>
          </div>
          <div class="ctrl">
            <UiToggle :model-value="p.enabled" @update:model-value="() => toggle(p)" />
            <button class="link" @click="openEdit(p)">{{ t('pref.edit') }}</button>
            <button class="link danger" @click="onRemove(p)">{{ t('pref.remove') }}</button>
          </div>
        </div>
      </div>
      <p v-else class="muted">{{ t('pref.none') }}</p>

      <UiButton v-if="!showForm" variant="ghost" style="margin-top: 14px" @click="openAdd">
        + {{ t('pref.add') }}
      </UiButton>

      <div v-else class="card form">
        <UiField :label="t('pref.type')">
          <UiSelect v-model="typeModel" :options="typeOptions" />
        </UiField>
        <UiField :label="t('pref.description')">
          <textarea v-model="description" rows="3" :placeholder="t('pref.descriptionPlaceholder')" />
        </UiField>
        <UiField :label="t('pref.exampleFolder')">
          <FolderBrowser v-model:resource="exResource" v-model:path="exPath" />
        </UiField>
        <StatusMessage v-if="error" :text="error" tone="error" />
        <div class="actions">
          <UiButton variant="ghost" @click="reset">{{ t('pref.cancel') }}</UiButton>
          <UiButton @click="onSave">{{ t('pref.save') }}</UiButton>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.muted {
  color: var(--muted);
}
.list .row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.list .row:last-child {
  border-bottom: none;
}
.meta {
  min-width: 0;
}
.top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  color: var(--muted);
}
.badge.structure {
  color: var(--primary);
}
.badge.coding {
  color: var(--accent);
}
.badge.ui-design {
  color: oklch(0.72 0.16 160);
}
.folder {
  font-size: 12px;
  color: var(--muted);
  font-family: var(--mono, monospace);
}
.desc {
  font-size: 13.5px;
  white-space: pre-wrap;
}
.ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.link {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
}
.link:hover {
  color: var(--fg);
}
.link.danger:hover {
  color: var(--danger);
}
.form {
  margin-top: 14px;
  padding: 16px;
}
.form textarea {
  width: 100%;
  background: var(--bg-soft);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  font-family: var(--sans);
  outline: none;
  resize: vertical;
}
.form textarea:focus {
  border-color: var(--primary);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}
</style>
