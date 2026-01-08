<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";
import NavBar from "./components/NavBar.vue";

const authStore = useAuthStore();

onMounted(() => {
  authStore.initialize();
});
</script>

<style></style>
