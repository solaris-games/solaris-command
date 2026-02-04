<template>
  <div
    class="bottom-nav-bar fixed-bottom d-flex d-md-none justify-content-around p-2"
  >
    <!-- Join Game -->
    <button
      class="btn btn-outline-theme"
      @click="$emit('toggle-join-game')"
      v-if="
        !galaxyStore.currentPlayer &&
        galaxyStore.galaxy?.game.state.status === GameStates.PENDING
      "
    >
      <i class="fas fa-handshake"></i>
    </button>

    <!-- Leaderboard -->
    <button
      class="btn btn-outline-theme"
      @click="$emit('toggle-leaderboard')"
      v-if="galaxyStore.currentPlayer"
    >
      <i class="fas fa-trophy"></i>
    </button>

    <!-- Reference -->
    <button
      class="btn btn-outline-theme"
      @click="$emit('toggle-reference-modal')"
    >
      <i class="fas fa-book"></i>
    </button>

    <!-- Event Log -->
    <button
      class="btn btn-outline-theme"
      @click="$emit('toggle-event-log-modal')"
      v-if="galaxyStore.currentPlayer"
    >
      <i class="fas fa-list-ul"></i>
    </button>

    <!-- Chat -->
    <button
      class="btn btn-outline-theme"
      @click="chatStore.toggleChat()"
      v-if="galaxyStore.currentPlayer"
      :class="{ active: chatStore.isOpen }"
    >
      <i class="fas fa-comments"></i>
    </button>

    <!-- Fleet -->
    <button
      class="btn btn-outline-theme"
      :class="{ active: fleetOpen }"
      @click="$emit('toggle-fleet')"
      v-if="galaxyStore.currentPlayer"
    >
      <i class="fas fa-rocket"></i>
    </button>

    <!-- Layers -->
    <button
      class="btn btn-outline-theme"
      :class="{ active: layersOpen }"
      @click="$emit('toggle-layers')"
    >
      <i class="fas fa-layer-group"></i>
    </button>

    <!-- Main Menu -->
    <button class="btn btn-outline-theme" @click="goToMainMenu">
      <i class="fas fa-chevron-left"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useGalaxyStore } from "../../stores/galaxy";
import { useChatStore } from "../../stores/chat";
import { GameStates } from "../../../../core/src/types/game";

const galaxyStore = useGalaxyStore();
const chatStore = useChatStore();

defineProps<{
  fleetOpen?: boolean;
  layersOpen?: boolean;
}>();

defineEmits([
  "toggle-join-game",
  "toggle-leaderboard",
  "toggle-reference-modal",
  "toggle-event-log-modal",
  "toggle-fleet",
  "toggle-layers",
]);

const goToMainMenu = () => {
  window.location.href = "/";
};
</script>

<style scoped>
.bottom-nav-bar {
  background-color: #212529;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1040;
}
</style>
