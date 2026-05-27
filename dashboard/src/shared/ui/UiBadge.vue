<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'primary' }>(), { tone: 'neutral' });
</script>

<template>
  <span :class="['badge', tone]"><slot /></span>
</template>

<style scoped>
.badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--muted);
}
.primary {
  background: color-mix(in oklch, var(--primary) 24%, transparent);
  color: var(--primary);
}
</style>
