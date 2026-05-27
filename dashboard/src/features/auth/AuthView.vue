<script setup lang="ts">
import { computed, ref } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import UiField from '../../shared/ui/UiField.vue';
import StatusMessage from '../../shared/ui/StatusMessage.vue';
import { useAuth } from './useAuth';

const { signupOpen, authenticate } = useAuth();

const mode = computed(() => (signupOpen.value ? 'signup' : 'login'));
const username = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  busy.value = true;
  error.value = '';
  const failure = await authenticate(mode.value, username.value, password.value);
  busy.value = false;
  if (failure) error.value = failure;
}
</script>

<template>
  <div class="center">
    <div class="card auth">
      <h1>{{ mode === 'signup' ? 'Create master account' : 'Sign in' }}</h1>
      <p class="sub">
        {{
          mode === 'signup'
            ? 'No users yet. The first account becomes the master and controls everything.'
            : 'Signup is closed. The master manages accounts from inside.'
        }}
      </p>

      <UiField label="Username">
        <input v-model="username" autocomplete="username" @keydown.enter="submit" />
      </UiField>
      <UiField label="Password">
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          @keydown.enter="submit"
        />
      </UiField>

      <UiButton block :disabled="busy" @click="submit">
        {{ mode === 'signup' ? 'Create master' : 'Sign in' }}
      </UiButton>
      <StatusMessage v-if="error" :text="error" tone="error" style="margin-top: 10px" />
    </div>
  </div>
</template>

<style scoped>
.center {
  min-height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.auth {
  width: 100%;
  max-width: 380px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
}
.auth h1 {
  font-size: 20px;
  margin-bottom: 4px;
}
.auth .sub {
  color: var(--muted);
  font-size: 13px;
  margin-bottom: 20px;
}
</style>
