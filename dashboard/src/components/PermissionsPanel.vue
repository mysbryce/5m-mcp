<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, type PermDescriptor } from '../api';

const descriptors = ref<PermDescriptor[]>([]);
const values = ref<Record<string, string>>({});
const draft = ref<Record<string, string>>({});
const loading = ref(true);
const msg = ref('');
const msgClass = ref('msg');

const groups = computed(() => {
  const out: Record<string, PermDescriptor[]> = {};
  for (const d of descriptors.value) (out[d.group] ??= []).push(d);
  return out;
});

const dirty = computed(() => Object.keys(draft.value).length > 0);

onMounted(load);

async function load() {
  loading.value = true;
  const { data } = await api<{ descriptors: PermDescriptor[]; values: Record<string, string> }>(
    '/permissions',
  );
  descriptors.value = data.descriptors ?? [];
  values.value = data.values ?? {};
  draft.value = {};
  loading.value = false;
}

function boolVal(convar: string): boolean {
  return (draft.value[convar] ?? values.value[convar]) === 'true';
}
function setBool(convar: string, v: boolean) {
  draft.value[convar] = v ? 'true' : 'false';
}
function strVal(convar: string): string {
  return draft.value[convar] ?? values.value[convar] ?? '';
}
function setStr(convar: string, v: string) {
  draft.value[convar] = v;
}

async function save() {
  if (!dirty.value) {
    msgClass.value = 'msg';
    msg.value = 'Nothing changed.';
    return;
  }
  msgClass.value = 'msg';
  msg.value = 'Saving…';
  const { status, data } = await api<{ values?: Record<string, string>; error?: string }>(
    '/permissions',
    'POST',
    { updates: draft.value },
  );
  if (status === 200 && data.values) {
    values.value = data.values;
    draft.value = {};
    msgClass.value = 'msg ok';
    msg.value = 'Saved & applied live.';
  } else {
    msgClass.value = 'msg error';
    msg.value = data.error ?? 'Failed.';
  }
}
</script>

<template>
  <div>
    <div class="section-title">Sandbox permissions</div>
    <div class="section-sub">
      These map directly to agent_api convars. Changes apply live and persist across restarts.
    </div>

    <div v-if="loading">Loading…</div>

    <template v-else>
      <div v-for="(items, group) in groups" :key="group" class="group">
        <h3>{{ group }}</h3>
        <div class="card">
          <div v-for="p in items" :key="p.convar" class="perm">
            <div class="meta">
              <div class="name">{{ p.label }}</div>
              <div class="desc">{{ p.description }}</div>
            </div>
            <div class="ctrl">
              <label v-if="p.type === 'bool'" class="switch">
                <input
                  type="checkbox"
                  :checked="boolVal(p.convar)"
                  @change="setBool(p.convar, ($event.target as HTMLInputElement).checked)"
                />
                <span class="track" />
              </label>
              <select
                v-else-if="p.type === 'enum'"
                :value="strVal(p.convar)"
                @change="setStr(p.convar, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="o in p.options" :key="o" :value="o">{{ o }}</option>
              </select>
              <input
                v-else
                :value="strVal(p.convar)"
                :placeholder="p.type === 'csv' ? 'comma,separated' : ''"
                @input="setStr(p.convar, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="save-bar">
        <div :class="msgClass">{{ msg }}</div>
        <button class="primary" :disabled="!dirty" @click="save">Save changes</button>
      </div>
    </template>
  </div>
</template>
