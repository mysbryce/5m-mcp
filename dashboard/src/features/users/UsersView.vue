<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import UiBadge from '../../shared/ui/UiBadge.vue';
import UiSelect from '../../shared/ui/UiSelect.vue';
import StatusMessage from '../../shared/ui/StatusMessage.vue';
import type { PublicUser, Role } from '../../shared/types';
import { useUsers } from './useUsers';
import { useI18n } from '../../i18n/useI18n';

const { users, loading, load, create, remove } = useUsers();
const { t } = useI18n();

const username = ref('');
const password = ref('');
const role = ref<Role>('member');
const error = ref('');

const roleOptions = computed(() => [
  { value: 'member', label: t('role.member') },
  { value: 'master', label: t('role.master') },
]);
const roleModel = computed({
  get: () => role.value as string,
  set: (v: string) => {
    role.value = v as Role;
  },
});

onMounted(load);

async function onAdd() {
  error.value = '';
  const result = await create(username.value, password.value, role.value);
  if (result.ok) {
    username.value = '';
    password.value = '';
    role.value = 'member';
  } else {
    error.value = result.error ?? t('users.failed');
  }
}

async function onRemove(user: PublicUser) {
  if (!confirm(t('users.confirmRemove', { name: user.username }))) return;
  await remove(user.id);
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString();
</script>

<template>
  <section>
    <div class="section-title">{{ t('users.title') }}</div>
    <div class="section-sub">{{ t('users.sub') }}</div>

    <div class="card">
      <p v-if="loading" class="row muted">{{ t('common.loading') }}</p>
      <div v-for="u in users" :key="u.id" class="row">
        <div>
          <span class="u-name">{{ u.username }}</span>
          <UiBadge :tone="u.role === 'master' ? 'primary' : 'neutral'" style="margin-left: 8px">
            {{ u.role === 'master' ? t('role.master') : t('role.member') }}
          </UiBadge>
          <div class="u-meta">{{ t('users.since') }} {{ fmtDate(u.createdAt) }}</div>
        </div>
        <UiButton v-if="u.role !== 'master'" variant="danger" @click="onRemove(u)">
          {{ t('users.remove') }}
        </UiButton>
      </div>

      <div class="add">
        <input v-model="username" :placeholder="t('users.username')" />
        <input v-model="password" type="password" :placeholder="t('users.password')" />
        <UiSelect v-model="roleModel" :options="roleOptions" />
        <UiButton @click="onAdd">{{ t('users.add') }}</UiButton>
      </div>
    </div>

    <StatusMessage v-if="error" :text="error" tone="error" style="margin-top: 10px" />
  </section>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.row:last-of-type {
  border-bottom: none;
}
.row.muted {
  color: var(--muted);
}
.u-name {
  font-weight: 600;
}
.u-meta {
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}
.add {
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 8px;
  padding: 14px 16px;
  border-top: 1px solid var(--border);
}
</style>
