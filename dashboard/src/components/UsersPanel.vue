<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, type PublicUser, type Role } from '../api';

const users = ref<PublicUser[]>([]);
const loading = ref(true);
const nu = ref('');
const np = ref('');
const nr = ref<Role>('member');
const err = ref('');

onMounted(load);

async function load() {
  loading.value = true;
  const { data } = await api<{ users: PublicUser[] }>('/users');
  users.value = data.users ?? [];
  loading.value = false;
}

async function add() {
  err.value = '';
  const { status, data } = await api<{ error?: string }>('/users', 'POST', {
    username: nu.value.trim(),
    password: np.value,
    role: nr.value,
  });
  if (status === 200) {
    nu.value = '';
    np.value = '';
    nr.value = 'member';
    await load();
  } else {
    err.value = data.error ?? 'Failed.';
  }
}

async function remove(u: PublicUser) {
  if (!confirm(`Remove ${u.username}?`)) return;
  await api('/users/' + u.id, 'DELETE');
  await load();
}

function fmt(d: string): string {
  return new Date(d).toLocaleDateString();
}
</script>

<template>
  <div>
    <div class="section-title">Users</div>
    <div class="section-sub">
      Only the master can create or remove accounts. There is no public signup once the master
      exists.
    </div>

    <div class="card">
      <div v-if="loading" class="row">Loading…</div>
      <div v-for="u in users" :key="u.id" class="row">
        <div>
          <span class="u-name">{{ u.username }}</span>
          <span :class="['pill', u.role === 'master' ? 'master' : '']">{{ u.role }}</span>
          <div class="u-meta">since {{ fmt(u.createdAt) }}</div>
        </div>
        <button v-if="u.role !== 'master'" class="danger" @click="remove(u)">Remove</button>
      </div>

      <div class="inline-form">
        <input v-model="nu" placeholder="username" />
        <input v-model="np" type="password" placeholder="password (min 8)" />
        <select v-model="nr">
          <option value="member">member</option>
          <option value="master">master</option>
        </select>
        <button class="primary" @click="add">Add</button>
      </div>
    </div>
    <div class="msg error">{{ err }}</div>
  </div>
</template>
