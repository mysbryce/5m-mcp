<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <label class="field">
    <span class="label">{{ label }}</span>
    <slot />
  </label>
</template>

<style scoped>
.field {
  display: block;
  margin-bottom: 14px;
}
.label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}
</style>
