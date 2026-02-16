<template>
  <div>Authenticating with Discord...</div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  const { code } = route.query;
  if (code) {
    const success = await authStore.loginDiscord(code as string);
    if (success) {
      router.push("/games");
    } else {
      router.push("/login");
    }
  } else {
    router.push("/login");
  }
});
</script>
