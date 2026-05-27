<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, clearSession, getSession, type PublicUser } from './api';
import AuthCard from './components/AuthCard.vue';
import PermissionsPanel from './components/PermissionsPanel.vue';
import UsersPanel from './components/UsersPanel.vue';

const ready = ref(false);
const me = ref<PublicUser | null>(null);
const signupOpen = ref(false);
const tab = ref<'permissions' | 'users'>('permissions');

onMounted(boot);

async function boot() {
  const state = await api<{ signupOpen: boolean; userCount: number }>('/auth/state');
  signupOpen.value = state.data.signupOpen;
  if (getSession()) {
    const res = await api<{ user: PublicUser }>('/auth/me');
    if (res.status === 200) {
      me.value = res.data.user;
      ready.value = true;
      return;
    }
    clearSession();
  }
  ready.value = true;
}

function onAuthed(user: PublicUser) {
  me.value = user;
}

async function logout() {
  await api('/auth/logout', 'POST');
  clearSession();
  me.value = null;
  await boot();
}
</script>

<template>
  <header class="topbar">
    <div class="brand"><span class="dot" /> agent_api <span class="badge">dashboard</span></div>
    <div class="userbar" v-if="me">
      <span>
        {{ me.username }}
        <span v-if="me.role === 'master'" class="pill master">master</span>
      </span>
      <button class="ghost" @click="logout">Sign out</button>
    </div>
  </header>

  <div v-if="!ready" class="center">Loading…</div>

  <AuthCard v-else-if="!me" :signup-open="signupOpen" @authed="onAuthed" />

  <main v-else>
    <div class="wrap">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'permissions' }" @click="tab = 'permissions'">
          Permissions
        </button>
        <button
          v-if="me.role === 'master'"
          class="tab"
          :class="{ active: tab === 'users' }"
          @click="tab = 'users'"
        >
          Users
        </button>
      </div>
      <PermissionsPanel v-if="tab === 'permissions'" />
      <UsersPanel v-else-if="tab === 'users' && me.role === 'master'" />
    </div>
  </main>
</template>
