<script setup lang="ts">
import { ref } from 'vue';
import type { FileNode } from '../../shared/types';

const props = defineProps<{ node: FileNode; path: string }>();
const emit = defineEmits<{ pick: [path: string, type: 'dir' | 'file'] }>();

const open = ref(true);
</script>

<template>
  <div class="node">
    <div class="row">
      <button
        v-if="node.type === 'dir'"
        class="twisty"
        :class="{ collapsed: !open }"
        @click="open = !open"
        :aria-label="open ? 'collapse' : 'expand'"
      >
        ▸
      </button>
      <span v-else class="twisty spacer"></span>

      <span class="label" :class="node.type">
        <span class="glyph">{{ node.type === 'dir' ? '📁' : '📄' }}</span>
        {{ node.name }}
      </span>

      <button class="ask" title="Ask the agent about this" @click="emit('pick', props.path, node.type)">
        ✎
      </button>
    </div>

    <div v-if="node.type === 'dir' && open && node.children?.length" class="children">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.name"
        :node="child"
        :path="props.path ? `${props.path}/${child.name}` : child.name"
        @pick="(p, ty) => emit('pick', p, ty)"
      />
    </div>
  </div>
</template>

<style scoped>
.node {
  font-size: 13px;
}
.row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  border-radius: 4px;
}
.row:hover {
  background: var(--surface, rgba(255, 255, 255, 0.04));
}
.row:hover .ask {
  opacity: 1;
}
.twisty {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  width: 16px;
  font-size: 11px;
  transition: transform 0.12s;
  padding: 0;
}
.twisty.collapsed {
  transform: rotate(-90deg);
}
.twisty.spacer {
  cursor: default;
}
.label {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.label.dir {
  font-weight: 500;
}
.glyph {
  font-size: 12px;
}
.ask {
  opacity: 0;
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
}
.children {
  padding-left: 14px;
  border-left: 1px solid var(--border);
  margin-left: 7px;
}
</style>
