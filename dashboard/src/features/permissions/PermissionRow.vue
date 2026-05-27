<script setup lang="ts">
import UiToggle from '../../shared/ui/UiToggle.vue';
import type { PermDescriptor } from '../../shared/types';

const props = defineProps<{ descriptor: PermDescriptor; value: string }>();
const emit = defineEmits<{ change: [value: string] }>();

function onBool(v: boolean) {
  emit('change', v ? 'true' : 'false');
}
function onText(e: Event) {
  emit('change', (e.target as HTMLInputElement | HTMLSelectElement).value);
}

const boolValue = () => props.value === 'true';
</script>

<template>
  <div class="perm">
    <div class="meta">
      <div class="name">{{ descriptor.label }}</div>
      <div class="desc">{{ descriptor.description }}</div>
    </div>
    <div class="ctrl">
      <UiToggle
        v-if="descriptor.type === 'bool'"
        :model-value="boolValue()"
        @update:model-value="onBool"
      />
      <select v-else-if="descriptor.type === 'enum'" :value="value" @change="onText">
        <option v-for="o in descriptor.options" :key="o" :value="o">{{ o }}</option>
      </select>
      <input
        v-else
        :value="value"
        :placeholder="descriptor.type === 'csv' ? 'comma,separated' : ''"
        @input="onText"
      />
    </div>
  </div>
</template>

<style scoped>
.perm {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.perm:last-child {
  border-bottom: none;
}
.meta {
  min-width: 0;
}
.name {
  font-weight: 600;
  font-size: 13.5px;
}
.desc {
  color: var(--muted);
  font-size: 12.5px;
  margin-top: 2px;
}
.ctrl {
  flex-shrink: 0;
  width: 220px;
  max-width: 42vw;
}
.ctrl input,
.ctrl select {
  font-size: 13px;
}
</style>
