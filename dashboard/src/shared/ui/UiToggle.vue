<script setup lang="ts">
const model = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="switch">
    <input type="checkbox" :checked="model" @change="model = ($event.target as HTMLInputElement).checked" />
    <span class="track" />
  </label>
</template>

<style scoped>
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.switch input {
  display: none;
}
.track {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  transition: background 0.15s;
  position: relative;
}
.track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--muted);
  transition:
    transform 0.15s,
    background 0.15s;
}
input:checked + .track {
  background: color-mix(in oklch, var(--primary) 40%, transparent);
  border-color: var(--primary);
}
input:checked + .track::after {
  transform: translateX(18px);
  background: var(--primary);
}
</style>
