<script setup lang="ts">
defineProps<{ text: string; tone?: 'neutral' | 'error' | 'ok' }>();
</script>

<template>
  <p :class="['msg', tone ?? 'neutral']">{{ text }}</p>
</template>

<style scoped>
.msg {
  font-size: 13px;
  min-height: 18px;
}
.error {
  color: var(--danger);
}
.ok {
  color: var(--accent);
}
.neutral {
  color: var(--muted);
}
</style>
