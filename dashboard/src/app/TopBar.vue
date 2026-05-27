<script setup lang="ts">
import { computed } from 'vue';
import UiBadge from '../shared/ui/UiBadge.vue';
import UiButton from '../shared/ui/UiButton.vue';
import UiSelect from '../shared/ui/UiSelect.vue';
import type { PublicUser } from '../shared/types';
import { useI18n } from '../i18n/useI18n';

defineProps<{ user: PublicUser | null }>();
defineEmits<{ logout: [] }>();

const { t, locale, setLocale, options } = useI18n();

const langOptions = computed(() => options.value.map((o) => ({ value: o.code, label: o.name })));
const langModel = computed({
  get: () => locale.value,
  set: (v: string) => setLocale(v),
});

</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="dot" /> agent_api <UiBadge>{{ t('nav.dashboard') }}</UiBadge>
    </div>
    <div class="right">
      <div class="lang">
        <UiSelect v-model="langModel" :options="langOptions" align="right" aria-label="Language" />
      </div>
      <template v-if="user">
        <span class="who">
          {{ user.username }}
          <UiBadge v-if="user.role === 'master'" tone="primary">{{ t('role.master') }}</UiBadge>
        </span>
        <UiButton variant="ghost" @click="$emit('logout')">{{ t('common.signOut') }}</UiButton>
      </template>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in oklch, var(--bg) 80%, transparent);
  backdrop-filter: blur(8px);
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 12px oklch(0.6049 0.1419 276.7 / 0.8);
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 13px;
}
.lang {
  width: 110px;
}
.who {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
