<script setup lang="ts">
import { onMounted, ref } from 'vue';
import TopBar from './app/TopBar.vue';
import AuthView from './features/auth/AuthView.vue';
import PermissionsView from './features/permissions/PermissionsView.vue';
import UsersView from './features/users/UsersView.vue';
import { useAuth } from './features/auth/useAuth';

const { me, ready, boot, logout } = useAuth();

type Tab = 'permissions' | 'users';
const tab = ref<Tab>('permissions');

onMounted(boot);
</script>

<template>
  <TopBar :user="me" @logout="logout" />

  <div v-if="!ready" class="placeholder">Loading…</div>

  <AuthView v-else-if="!me" />

  <main v-else>
    <div class="wrap">
      <nav class="tabs">
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
      </nav>

      <PermissionsView v-if="tab === 'permissions'" />
      <UsersView v-else-if="tab === 'users' && me.role === 'master'" />
    </div>
  </main>
</template>

<style scoped>
.placeholder {
  display: grid;
  place-items: center;
  min-height: calc(100vh - 56px);
  color: var(--muted);
}
main {
  padding: 28px 0 64px;
}
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}
.tab {
  background: transparent;
  color: var(--muted);
  border: none;
  cursor: pointer;
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 14px;
  border-bottom: 2px solid transparent;
}
.tab.active {
  color: var(--fg);
  border-bottom-color: var(--primary);
}
</style>
