<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'danger';
    block?: boolean;
    disabled?: boolean;
  }>(),
  { variant: 'primary', block: false, disabled: false },
);
</script>

<template>
  <button :class="['btn', variant, { block }]" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  cursor: pointer;
  font-family: var(--sans);
  font-weight: 600;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  transition:
    opacity 0.15s,
    background 0.15s;
}
.btn.block {
  width: 100%;
}
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.primary {
  background: var(--primary);
  color: var(--primary-fg);
}
.primary:hover:not(:disabled) {
  opacity: 0.9;
}
.ghost {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 5px 10px;
  font-size: 12px;
}
.ghost:hover:not(:disabled) {
  background: var(--bg-soft);
  color: var(--fg);
}
.danger {
  background: transparent;
  color: var(--danger);
  border: 1px solid color-mix(in oklch, var(--danger) 40%, var(--border));
  padding: 5px 10px;
  font-size: 12px;
}
.danger:hover:not(:disabled) {
  background: color-mix(in oklch, var(--danger) 14%, transparent);
}
</style>
