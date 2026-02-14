<template>
  <NavBar />

  <div class="app-content p-0">
    <div class="row min-vh-100">
      <!-- Left Column: Introduction -->
      <div
        class="col-12 col-md-6 bg-light d-flex flex-column justify-content-center p-5"
      >
        <div>
          <h1 class="display-5">Solaris: Command</h1>
          <p class="lead">
            <strong>Solaris: Command</strong> is a persistent,
            <span class="text-info">weeks-long</span> struggle for galactic
            supremacy. On this
            <span class="text-info">hex-based</span> battlefield, your
            <span class="text-warning">tactical positioning</span> and
            <span class="text-warning">logistical foresight</span> are the only
            things standing between <span class="text-success">glory</span> and
            <span class="text-danger">extinction</span>.
          </p>
          <p>
            Forge alliances in real-time, navigate deep-space betrayals, and
            command your fleets across a living galaxy. The front line is
            waiting for its next commander.
          </p>
          <p class="fw-bold">Sign Up & Claim Your Sector</p>

          <hr />

          <h2 class="mt-3">Enter the War Room</h2>
          <p>
            <strong>The best commanders don't fight alone</strong>.
            <span class="text-warning">Join our official Discord</span> to
            coordinate operations, negotiate secret pacts, and stay updated on
            the latest shifts in the galactic front.
          </p>
          <a
            href="https://discord.com/invite/v7PD33d"
            target="_blank"
            class="btn btn-primary"
            ><i class="fa-brands fa-discord me-1"></i>Join the Discord</a
          >
        </div>
      </div>

      <!-- Right Column: Login Form -->
      <div
        class="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center p-5"
      >
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
            <div class="text-center mt-3 d-flex justify-content-center">
              <GoogleLogin :callback="handleGoogleLogin" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import NavBar from "../components/NavBar.vue";
import { GoogleLogin } from "vue3-google-login";
import { configInjectionKey } from "@/utils/config.ts";

const config = inject(configInjectionKey)!;

const username = ref("");
const email = ref("");
const error = ref("");
const authStore = useAuthStore();
const router = useRouter();
const enableDevAuth = ref(config.devAuthEnabled);

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
.login-content {
  width: 100%;
  max-width: 400px;
}

.bg-light {
  background-color: #f8f9fa !important;
}

/* Dark mode adjustments */
[data-bs-theme="dark"] .bg-light {
  background-color: #2c2c2c !important;
}
</style>
