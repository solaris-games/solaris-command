<template>
  <NavBar />

  <div id="content" class="app-content">
    <div class="card">
      <div class="card-body">
        <h1>User Profile</h1>
        <div v-if="authStore.user">
          <p><strong>Username:</strong> {{ authStore.user.username }}</p>
          <p><strong>Email:</strong> {{ authStore.user.email }}</p>
          <p><strong>ID:</strong> {{ authStore.user._id }}</p>

          <button @click="handleLogout" class="btn btn-success">Logout</button>
          <hr />
          <button @click="handleDelete" class="btn btn-outline-danger">
            Delete Account
          </button>
        </div>
      </div>

      <!-- card-arrow -->
      <div class="card-arrow">
        <div class="card-arrow-top-left"></div>
        <div class="card-arrow-top-right"></div>
        <div class="card-arrow-bottom-left"></div>
        <div class="card-arrow-bottom-right"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import NavBar from "../components/NavBar.vue";
import axios from "axios";

const authStore = useAuthStore();
const router = useRouter();

function handleLogout() {
  authStore.logout();
  router.push("/login");
}

async function handleDelete() {
  if (
    !confirm(
      "Are you sure? This will delete all your data and cannot be undone."
    )
  )
    return;

  try {
    await axios.delete(`/api/v1/users/${authStore.user?._id}`);
    authStore.logout();
    router.push("/login");
  } catch (err: any) {
    alert("Failed to delete account: " + err.message);
  }
}
</script>

<style scoped></style>
