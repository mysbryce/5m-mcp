<script setup lang="ts">
import { computed } from 'vue';
import UiToggle from '../../shared/ui/UiToggle.vue';
import UiSelect from '../../shared/ui/UiSelect.vue';
import type { PermDescriptor } from '../../shared/types';
import { useI18n } from '../../i18n/useI18n';

const props = defineProps<{ descriptor: PermDescriptor; value: string }>();
const emit = defineEmits<{ change: [value: string] }>();

const { t } = useI18n();

// Prefer a dashboard translation keyed by convar; fall back to the
// server-provided English label/description when no translation exists.
function tr(key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}
const label = computed(() => tr(`perm.${props.descriptor.convar}.label`, props.descriptor.label));
const desc = computed(() =>
  tr(`perm.${props.descriptor.convar}.desc`, props.descriptor.description),
);

function onBool(v: boolean) {
  emit('change', v ? 'true' : 'false');
}
function onText(e: Event) {
  emit('change', (e.target as HTMLInputElement).value);
}

const boolValue = () => props.value === 'true';

const enumOptions = computed(() =>
  (props.descriptor.options ?? []).map((o) => ({ value: o, label: o })),
);
const enumModel = computed({
  get: () => props.value,
  set: (v: string) => emit('change', v),
});
</script>

<template>
  <div class="perm">
    <div class="meta">
      <div class="name">{{ label }}</div>
      <div class="desc">{{ desc }}</div>
    </div>
    <div class="ctrl">
      <UiToggle
        v-if="descriptor.type === 'bool'"
        :model-value="boolValue()"
        @update:model-value="onBool"
      />
      <UiSelect
        v-else-if="descriptor.type === 'enum'"
        v-model="enumModel"
        :options="enumOptions"
        align="right"
      />
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
