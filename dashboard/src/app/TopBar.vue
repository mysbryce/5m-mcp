<script setup lang="ts">
import UiBadge from '../shared/ui/UiBadge.vue';
import UiButton from '../shared/ui/UiButton.vue';
import type { PublicUser } from '../shared/types';

defineProps<{ user: PublicUser | null }>();
defineEmits<{ logout: [] }>();
</script>

<template>
  <header class="topbar">
    <div class="brand"><span class="dot" /> agent_api <UiBadge>dashboard</UiBadge></div>
    <div v-if="user" class="userbar">
      <span class="who">
        {{ user.username }}
        <UiBadge v-if="user.role === 'master'" tone="primary">master</UiBadge>
      </span>
      <UiButton variant="ghost" @click="$emit('logout')">Sign out</UiButton>
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
.userbar {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
  font-size: 13px;
}
.who {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
