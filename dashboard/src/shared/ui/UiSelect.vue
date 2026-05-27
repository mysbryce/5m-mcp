<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

interface Option {
  value: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    options: Option[];
    ariaLabel?: string;
    align?: 'left' | 'right';
  }>(),
  { align: 'left' },
);

const model = defineModel<string>({ required: true });

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const selectedLabel = computed(
  () => props.options.find((o) => o.value === model.value)?.label ?? model.value,
);

function onDocPointer(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) close();
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}
function attach() {
  document.addEventListener('mousedown', onDocPointer);
  document.addEventListener('keydown', onKey);
}
function detach() {
  document.removeEventListener('mousedown', onDocPointer);
  document.removeEventListener('keydown', onKey);
}
function toggle() {
  open.value = !open.value;
  if (open.value) attach();
  else detach();
}
function close() {
  if (!open.value) return;
  open.value = false;
  detach();
}
function pick(value: string) {
  model.value = value;
  close();
}

onBeforeUnmount(detach);
</script>

<template>
  <div ref="root" class="select">
    <button
      type="button"
      class="trigger"
      :class="{ open }"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="value">{{ selectedLabel }}</span>
      <svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <ul v-if="open" class="menu" :class="align" role="listbox">
      <li v-for="o in options" :key="o.value" role="option" :aria-selected="o.value === model">
        <button
          type="button"
          class="item"
          :class="{ active: o.value === model }"
          @click="pick(o.value)"
        >
          {{ o.label }}
          <svg
            v-if="o.value === model"
            class="check"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.select {
  position: relative;
  display: inline-block;
  width: 100%;
}
.trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--bg-soft);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  font-family: var(--sans);
  cursor: pointer;
  transition: border-color 0.15s;
}
.trigger:hover {
  border-color: color-mix(in oklch, var(--primary) 50%, var(--border));
}
.trigger.open {
  border-color: var(--primary);
}
.value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chev {
  flex-shrink: 0;
  color: var(--muted);
  transition: transform 0.15s;
}
.trigger.open .chev {
  transform: rotate(180deg);
}
.menu {
  position: absolute;
  z-index: 50;
  top: calc(100% + 6px);
  min-width: 100%;
  list-style: none;
  margin: 0;
  padding: 4px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  max-height: 280px;
  overflow-y: auto;
  animation: pop 0.12s ease-out;
}
.menu.left {
  left: 0;
}
.menu.right {
  right: 0;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: transparent;
  border: none;
  color: var(--muted);
  font-family: var(--sans);
  font-size: 13px;
  text-align: left;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}
.item:hover {
  background: var(--bg-soft);
  color: var(--fg);
}
.item.active {
  color: var(--primary);
}
.check {
  flex-shrink: 0;
}
</style>
