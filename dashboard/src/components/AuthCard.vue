<script setup lang="ts">
import { ref } from 'vue';
import { api, setSession, type PublicUser } from '../api';

const props = defineProps<{ signupOpen: boolean }>();
const emit = defineEmits<{ authed: [user: PublicUser] }>();

const username = ref('');
const password = ref('');
const msg = ref('');
const msgClass = ref('msg');
const busy = ref(false);

const mode = props.signupOpen ? 'signup' : 'login';

async function submit() {
  busy.value = true;
  msgClass.value = 'msg';
  msg.value = 'Working…';
  const ep = mode === 'signup' ? '/auth/signup' : '/auth/login';
  const { status, data } = await api<{ token?: string; user?: PublicUser; error?: string }>(
    ep,
    'POST',
    { username: username.value.trim(), password: password.value },
  );
  busy.value = false;
  if (status === 200 && data.token && data.user) {
    setSession(data.token);
    emit('authed', data.user);
  } else {
    msgClass.value = 'msg error';
    msg.value = data.error ?? 'Failed.';
  }
}
</script>

<template>
  <div class="center">
    <div class="auth">
      <h1>{{ mode === 'signup' ? 'Create master account' : 'Sign in' }}</h1>
      <p class="sub">
        {{
          mode === 'signup'
            ? 'No users yet. The first account becomes the master and controls everything.'
            : 'Signup is closed. The master manages accounts from inside.'
        }}
      </p>
      <div class="field">
        <label>Username</label>
        <input v-model="username" autocomplete="username" @keydown.enter="submit" />
      </div>
      <div class="field">
        <label>Password</label>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          @keydown.enter="submit"
        />
      </div>
      <button class="primary block" :disabled="busy" @click="submit">
        {{ mode === 'signup' ? 'Create master' : 'Sign in' }}
      </button>
      <div :class="msgClass">{{ msg }}</div>
    </div>
  </div>
</template>
