<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Solaris: Command</h1>
      <h2>Dev Prototype Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" v-model="username" type="text" required placeholder="Enter username" />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required placeholder="Enter email" />
        </div>
        <button type="submit">Login</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const username = ref('');
const email = ref('');
const error = ref('');
const authStore = useAuthStore();
const router = useRouter();

async function handleLogin() {
  const success = await authStore.loginDev(username.value, email.value);
  if (success) {
    router.push('/games');
  } else {
    error.value = 'Login failed. Ensure dev auth is enabled server-side.';
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #1a1a1a;
  color: #fff;
}
.login-card {
  background: #333;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}
input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.25rem;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 0.75rem;
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  margin-top: 1rem;
}
.error {
  color: #ff6b6b;
  margin-top: 1rem;
}
</style>
