<script setup lang="ts">
import { onMounted, ref } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import StatusMessage from '../../shared/ui/StatusMessage.vue';
import PermissionRow from './PermissionRow.vue';
import { usePermissions } from './usePermissions';
import { useI18n } from '../../i18n/useI18n';

const { groups, dirty, loading, current, stage, load, save } = usePermissions();
const { t } = useI18n();

const status = ref<{ text: string; tone: 'neutral' | 'error' | 'ok' } | null>(null);

onMounted(load);

function groupLabel(group: string): string {
  const key = `permGroup.${group}`;
  const v = t(key);
  return v === key ? group : v;
}

async function onSave() {
  if (!dirty.value) {
    status.value = { text: t('perm.nothingChanged'), tone: 'neutral' };
    return;
  }
  status.value = { text: t('perm.saving'), tone: 'neutral' };
  const result = await save();
  status.value = result.ok
    ? { text: t('perm.saved'), tone: 'ok' }
    : { text: result.error ?? t('perm.failed'), tone: 'error' };
}
</script>

<template>
  <section>
    <div class="section-title">{{ t('perm.title') }}</div>
    <div class="section-sub">{{ t('perm.sub') }}</div>

    <p v-if="loading" class="loading">{{ t('common.loading') }}</p>

    <template v-else>
      <div v-for="(items, group) in groups" :key="group" class="group">
        <h3>{{ groupLabel(group) }}</h3>
        <div class="card">
          <PermissionRow
            v-for="p in items"
            :key="p.convar"
            :descriptor="p"
            :value="current(p.convar)"
            @change="(v) => stage(p.convar, v)"
          />
        </div>
      </div>

      <div class="save-bar">
        <StatusMessage v-if="status" :text="status.text" :tone="status.tone" />
        <UiButton :disabled="!dirty" @click="onSave">{{ t('perm.save') }}</UiButton>
      </div>
    </template>
  </section>
</template>

<style scoped>
.loading {
  color: var(--muted);
}
.group {
  margin-bottom: 22px;
}
.group h3 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 10px;
}
.save-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  padding: 14px 0;
  background: linear-gradient(to top, var(--bg), transparent);
}
</style>
