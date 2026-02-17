<template>
  <div v-if="config.error" class="app-content p-0 d-flex flex-column align-items-center">
    <h1 class="display-5">Solaris: Command</h1>

    <p class="lead">An error occurred while loading the application. Solaris:Command might be down for maintenance. Please try reloading the page later:</p>
    <div>
      <button @click="reload" class="btn btn-primary">Reload</button>
    </div>
  </div>
  <router-view v-else></router-view>
</template>

<script setup lang="ts">
import {inject, onMounted} from "vue";
import { useAuthStore } from "./stores/auth";
import {configInjectionKey} from "@/utils/config.ts";

const config = inject(configInjectionKey)!;

const authStore = useAuthStore();

const reload = () => window.location.reload();

onMounted(() => {
  authStore.initialize();
});
</script>

<style>
body {
  min-height: unset;
}

.app-content {
  margin-top: 3.25rem !important; /* Fixes a weird top bar padding issue */
}
</style>
