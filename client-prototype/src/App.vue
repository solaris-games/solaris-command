<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();

onMounted(() => {
  authStore.initialize();
});
</script>

<style>
body {
  margin: 0;
  background: #121212;
  color: #e0e0e0;
  font-family: sans-serif;
}
</style>
