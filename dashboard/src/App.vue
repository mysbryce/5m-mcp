<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import TopBar from './app/TopBar.vue';
import TabIcon from './app/TabIcon.vue';
import AuthView from './features/auth/AuthView.vue';
import PermissionsView from './features/permissions/PermissionsView.vue';
import PreferencesView from './features/preferences/PreferencesView.vue';
import SkillsView from './features/skills/SkillsView.vue';
import LogsView from './features/logs/LogsView.vue';
import UsersView from './features/users/UsersView.vue';
import { useAuth } from './features/auth/useAuth';
import { useI18n } from './i18n/useI18n';

const { me, ready, boot, logout } = useAuth();
const { t } = useI18n();

type Tab = 'logs' | 'permissions' | 'preferences' | 'skills' | 'users';
const tab = ref<Tab>('permissions');

// Master lands on Monitor by default; members only have Permissions.
watch(me, (u) => {
  if (u) tab.value = u.role === 'master' ? 'logs' : 'permissions';
});

onMounted(boot);
</script>

<template>
  <TopBar :user="me" @logout="logout" />

  <div v-if="!ready" class="placeholder">{{ t('common.loading') }}</div>

  <AuthView v-else-if="!me" />

  <main v-else>
    <div class="wrap">
      <nav class="tabs">
        <button
          v-if="me.role === 'master'"
          class="tab"
          :class="{ active: tab === 'logs' }"
          @click="tab = 'logs'"
        >
          <TabIcon name="monitor" />{{ t('tabs.logs') }}
        </button>
        <button class="tab" :class="{ active: tab === 'permissions' }" @click="tab = 'permissions'">
          <TabIcon name="permissions" />{{ t('tabs.permissions') }}
        </button>
        <template v-if="me.role === 'master'">
          <button
            class="tab"
            :class="{ active: tab === 'preferences' }"
            @click="tab = 'preferences'"
          >
            <TabIcon name="preferences" />{{ t('tabs.preferences') }}
          </button>
          <button class="tab" :class="{ active: tab === 'skills' }" @click="tab = 'skills'">
            <TabIcon name="skills" />{{ t('tabs.skills') }}
          </button>
          <button class="tab" :class="{ active: tab === 'users' }" @click="tab = 'users'">
            <TabIcon name="users" />{{ t('tabs.users') }}
          </button>
        </template>
      </nav>

      <LogsView v-if="tab === 'logs' && me.role === 'master'" />
      <PermissionsView v-else-if="tab === 'permissions'" />
      <PreferencesView v-else-if="tab === 'preferences' && me.role === 'master'" />
      <SkillsView v-else-if="tab === 'skills' && me.role === 'master'" />
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
  display: inline-flex;
  align-items: center;
  gap: 7px;
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
.tab:hover {
  color: var(--fg);
}
.tab.active {
  color: var(--fg);
  border-bottom-color: var(--primary);
}
</style>
