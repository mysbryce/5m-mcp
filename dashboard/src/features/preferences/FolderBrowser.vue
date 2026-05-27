<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import UiSelect from '../../shared/ui/UiSelect.vue';
import { preferencesApi } from './preferences.api';
import type { BrowseResource } from '../../shared/types';
import { useI18n } from '../../i18n/useI18n';

const resource = defineModel<string>('resource', { default: '' });
const path = defineModel<string>('path', { default: '' });

const { t } = useI18n();
const resources = ref<BrowseResource[]>([]);
const dirs = ref<string[]>([]);
const loading = ref(false);

const resourceOptions = computed(() =>
  resources.value.map((r) => ({ value: r.name, label: r.name })),
);

onMounted(async () => {
  const { data } = await preferencesApi.resources();
  resources.value = data.resources ?? [];
});

async function refreshDirs(): Promise<void> {
  if (!resource.value) {
    dirs.value = [];
    return;
  }
  loading.value = true;
  const { data } = await preferencesApi.listDirs(resource.value, path.value);
  dirs.value = data.dirs ?? [];
  loading.value = false;
}

watch(resource, () => {
  path.value = '';
  void refreshDirs();
});
watch(path, () => void refreshDirs());

function enter(dir: string): void {
  path.value = path.value ? `${path.value}/${dir}` : dir;
}
function up(): void {
  const parts = path.value.split('/').filter(Boolean);
  parts.pop();
  path.value = parts.join('/');
}
function clear(): void {
  resource.value = '';
  path.value = '';
  dirs.value = [];
}
</script>

<template>
  <div class="browser">
    <div class="pick">
      <UiSelect
        v-if="resourceOptions.length"
        v-model="resource"
        :options="resourceOptions"
        :aria-label="t('pref.exampleResource')"
      />
      <button v-if="resource" type="button" class="link" @click="clear">{{ t('pref.clear') }}</button>
    </div>

    <template v-if="resource">
      <div class="crumbs">
        <button type="button" class="up" :disabled="!path" @click="up">↑ {{ t('pref.up') }}</button>
        <span class="cur">{{ resource }}/{{ path }}</span>
      </div>
      <div class="dirs">
        <span v-if="loading" class="muted">{{ t('common.loading') }}</span>
        <template v-else>
          <button v-for="d in dirs" :key="d" type="button" class="dir" @click="enter(d)">
            {{ d }}/
          </button>
          <span v-if="!dirs.length" class="muted">{{ t('pref.noSubfolders') }}</span>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.browser {
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 10px;
}
.pick {
  display: flex;
  align-items: center;
  gap: 10px;
}
.link {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}
.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.up {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg);
  cursor: pointer;
  font-size: 12px;
  padding: 3px 8px;
}
.up:disabled {
  opacity: 0.4;
  cursor: default;
}
.cur {
  color: var(--muted);
  font-size: 12px;
  font-family: var(--mono, monospace);
}
.dirs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.dir {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 9px;
}
.dir:hover {
  border-color: var(--primary);
}
.muted {
  color: var(--muted);
  font-size: 12px;
}
</style>
