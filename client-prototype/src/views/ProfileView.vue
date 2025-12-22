<template>
  <div class="profile-view">
    <NavBar />
    <div class="content">
      <h1>User Profile</h1>
      <div v-if="authStore.user" class="card">
        <p><strong>Username:</strong> {{ authStore.user.username }}</p>
        <p><strong>Email:</strong> {{ authStore.user.email }}</p>
        <p><strong>ID:</strong> {{ authStore.user._id }}</p>

        <button @click="handleLogout" class="logout-btn">Logout</button>
        <hr />
        <button @click="handleDelete" class="delete-btn">Delete Account</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';
import NavBar from '../components/NavBar.vue';

const authStore = useAuthStore();
const router = useRouter();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

async function handleDelete() {
  if (!confirm('Are you sure? This will delete all your data and cannot be undone.')) return;

  try {
    await axios.delete(`/api/v1/users/${authStore.user?._id}`);
    authStore.logout();
    router.push('/login');
  } catch (err: any) {
    alert('Failed to delete account: ' + err.message);
  }
}
</script>

<style scoped>
.profile-view {
  min-height: 100vh;
  background: #121212;
}
.content {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}
.card {
  background: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
}
button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: none;
  color: white;
}
.logout-btn { background: #555; }
.delete-btn { background: #F44336; float: right; }
</style>
