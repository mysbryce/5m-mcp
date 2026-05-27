<script setup lang="ts">
import { onMounted, ref } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import UiToggle from '../../shared/ui/UiToggle.vue';
import UiField from '../../shared/ui/UiField.vue';
import StatusMessage from '../../shared/ui/StatusMessage.vue';
import { useSkills } from './useSkills';
import type { CustomSkill } from '../../shared/types';
import { useI18n } from '../../i18n/useI18n';

const { items, catalog, loading, load, save, remove, toggle } = useSkills();
const { t } = useI18n();

const editingId = ref<string | null>(null);
const showForm = ref(false);
const name = ref('');
const description = ref('');
const body = ref('');
const tools = ref<string[]>([]);
const categories = ref<string[]>([]);
const error = ref('');

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function reset(): void {
  editingId.value = null;
  showForm.value = false;
  name.value = '';
  description.value = '';
  body.value = '';
  tools.value = [];
  categories.value = [];
  error.value = '';
}

function openAdd(): void {
  reset();
  showForm.value = true;
}

function openEdit(s: CustomSkill): void {
  editingId.value = s.id;
  name.value = s.name;
  description.value = s.description;
  body.value = s.body;
  tools.value = [...s.triggers.tools];
  categories.value = [...s.triggers.categories];
  error.value = '';
  showForm.value = true;
}

async function onFile(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  body.value = await file.text();
  if (!name.value) name.value = file.name.replace(/\.(md|markdown|txt)$/i, '');
}

async function onSave(): Promise<void> {
  error.value = '';
  const result = await save({
    id: editingId.value ?? undefined,
    name: name.value,
    description: description.value,
    body: body.value,
    triggers: { tools: tools.value, categories: categories.value },
    enabled: true,
  });
  if (result.ok) reset();
  else error.value = result.error ?? t('skill.failed');
}

async function onRemove(s: CustomSkill): Promise<void> {
  if (!confirm(t('skill.confirmRemove'))) return;
  await remove(s.id);
}

function triggerSummary(s: CustomSkill): string {
  return [...s.triggers.categories.map((c) => `#${c}`), ...s.triggers.tools].join(', ') || '—';
}

onMounted(load);
</script>

<template>
  <section>
    <div class="section-title">{{ t('skill.title') }}</div>
    <div class="section-sub">{{ t('skill.sub') }}</div>

    <p v-if="loading" class="muted">{{ t('common.loading') }}</p>

    <template v-else>
      <div v-if="items.length" class="card list">
        <div v-for="s in items" :key="s.id" class="row">
          <div class="meta">
            <div class="name">{{ s.name }}</div>
            <div v-if="s.description" class="desc">{{ s.description }}</div>
            <div class="triggers">{{ t('skill.triggersLabel') }}: {{ triggerSummary(s) }}</div>
          </div>
          <div class="ctrl">
            <UiToggle :model-value="s.enabled" @update:model-value="() => toggle(s)" />
            <button class="link" @click="openEdit(s)">{{ t('skill.edit') }}</button>
            <button class="link danger" @click="onRemove(s)">{{ t('skill.remove') }}</button>
          </div>
        </div>
      </div>
      <p v-else class="muted">{{ t('skill.none') }}</p>

      <UiButton v-if="!showForm" variant="ghost" style="margin-top: 14px" @click="openAdd">
        + {{ t('skill.add') }}
      </UiButton>

      <div v-else class="card form">
        <UiField :label="t('skill.name')">
          <input v-model="name" :placeholder="t('skill.namePlaceholder')" />
        </UiField>
        <UiField :label="t('skill.description')">
          <input v-model="description" :placeholder="t('skill.descriptionPlaceholder')" />
        </UiField>
        <UiField :label="t('skill.body')">
          <textarea v-model="body" rows="7" :placeholder="t('skill.bodyPlaceholder')" />
          <label class="upload">
            {{ t('skill.upload') }}
            <input type="file" accept=".md,.markdown,.txt" @change="onFile" />
          </label>
        </UiField>
        <UiField :label="t('skill.triggersCategories')">
          <div class="chips">
            <button
              v-for="c in catalog.categories"
              :key="c"
              type="button"
              class="chip"
              :class="{ on: categories.includes(c) }"
              @click="categories = toggleIn(categories, c)"
            >
              #{{ c }}
            </button>
          </div>
        </UiField>
        <UiField :label="t('skill.triggersTools')">
          <div class="chips">
            <button
              v-for="tool in catalog.tools"
              :key="tool"
              type="button"
              class="chip"
              :class="{ on: tools.includes(tool) }"
              @click="tools = toggleIn(tools, tool)"
            >
              {{ tool }}
            </button>
          </div>
        </UiField>
        <StatusMessage v-if="error" :text="error" tone="error" />
        <div class="actions">
          <UiButton variant="ghost" @click="reset">{{ t('skill.cancel') }}</UiButton>
          <UiButton @click="onSave">{{ t('skill.save') }}</UiButton>
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
.name {
  font-weight: 600;
  font-size: 14px;
}
.desc {
  color: var(--muted);
  font-size: 12.5px;
  margin-top: 2px;
}
.triggers {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
  font-family: var(--mono, monospace);
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
  font-size: 13px;
  font-family: var(--mono, monospace);
  outline: none;
  resize: vertical;
}
.form textarea:focus {
  border-color: var(--primary);
}
.upload {
  display: inline-block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
}
.upload input {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 10px;
  font-family: var(--sans);
}
.chip.on {
  background: color-mix(in oklch, var(--primary) 30%, transparent);
  border-color: var(--primary);
  color: var(--fg);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}
</style>
