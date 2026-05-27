<script setup lang="ts">
import { onMounted, ref } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import StatusMessage from '../../shared/ui/StatusMessage.vue';
import PermissionRow from './PermissionRow.vue';
import { usePermissions } from './usePermissions';

const { groups, dirty, loading, current, stage, load, save } = usePermissions();

const status = ref<{ text: string; tone: 'neutral' | 'error' | 'ok' } | null>(null);

onMounted(load);

async function onSave() {
  if (!dirty.value) {
    status.value = { text: 'Nothing changed.', tone: 'neutral' };
    return;
  }
  status.value = { text: 'Saving…', tone: 'neutral' };
  const result = await save();
  status.value = result.ok
    ? { text: 'Saved & applied live.', tone: 'ok' }
    : { text: result.error ?? 'Failed.', tone: 'error' };
}
</script>

<template>
  <section>
    <div class="section-title">Sandbox permissions</div>
    <div class="section-sub">
      These map directly to agent_api convars. Changes apply live and persist across restarts.
    </div>

    <p v-if="loading" class="loading">Loading…</p>

    <template v-else>
      <div v-for="(items, group) in groups" :key="group" class="group">
        <h3>{{ group }}</h3>
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
        <UiButton :disabled="!dirty" @click="onSave">Save changes</UiButton>
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
