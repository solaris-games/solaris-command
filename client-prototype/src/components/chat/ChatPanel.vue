<template>
  <div class="h-100 pb-2">
    <ChatWindow v-if="chatStore.activeConversationId" />
    <ConversationList v-else />
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from "../../stores/chat";
import ChatWindow from "./ChatWindow.vue";
import ConversationList from "./ConversationList.vue";
import { onMounted } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";

const chatStore = useChatStore();
const galaxyStore = useGalaxyStore();

onMounted(() => {
  if (galaxyStore.galaxy) {
    chatStore.fetchConversations(galaxyStore.galaxy.game._id);
  }
});
</script>
