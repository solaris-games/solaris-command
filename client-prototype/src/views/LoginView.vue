<template>
  <NavBar />

  <div id="content" class="app-content">
    <div class="login">
      <!-- BEGIN login-content -->
      <div class="login-content">
        <form v-if="enableDevAuth" @submit.prevent="handleLogin">
          <h1 class="text-center">Dev Sign In</h1>
          <div class="form-group mb-3">
            <label class="form-label"
              >Username <span class="text-danger">*</span></label
            >
            <input
              id="username"
              v-model="username"
              type="text"
              class="form-control form-control-lg bg-inverse bg-opacity-5"
              placeholder=""
            />
          </div>
          <div class="form-group mb-3">
            <label class="form-label"
              >Email <span class="text-danger">*</span></label
            >
            <input
              id="email"
              v-model="email"
              type="text"
              class="form-control form-control-lg bg-inverse bg-opacity-5"
              placeholder=""
            />
          </div>
          <button
            type="submit"
            class="btn btn-outline-theme btn-lg d-block w-100 fw-500 mb-3"
            data-bs-toggle="tooltip"
            title="Sign in with a development account"
          >
            Sign In
          </button>
          <p v-if="error" class="text-danger">{{ error }}</p>
        </form>
        <div v-else>
          <h1 class="text-center">Sign In</h1>
          <div class="text-center mt-3">
            <GoogleLogin :callback="handleGoogleLogin" />
          </div>
        </div>
      </div>
      <!-- END login-content -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import NavBar from "../components/NavBar.vue";
import { GoogleLogin } from "vue3-google-login";

const username = ref("");
const email = ref("");
const error = ref("");
const authStore = useAuthStore();
const router = useRouter();
const enableDevAuth = ref(import.meta.env.VITE_ENABLE_DEV_AUTH === "true");

async function handleLogin() {
  const success = await authStore.loginDev(username.value, email.value);
  if (success) {
    router.push("/games");
  } else {
    error.value = "Login failed. Ensure dev auth is enabled server-side.";
  }
}

async function handleGoogleLogin(response: any) {
  const idToken = response.credential;
  const success = await authStore.loginGoogle(idToken);
  if (success) {
    router.push("/games");
  } else {
    error.value = "Google login failed.";
  }
}
</script>

<style scoped>
.login {
  min-height: 50vh;
}
</style>
