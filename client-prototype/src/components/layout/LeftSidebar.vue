<template>
  <div
    class="left-sidebar d-flex flex-column p-2 h-100"
    style="background: var(--bs-app-header-bg)"
  >
    <button
      class="btn btn-outline-theme mb-2"
      @click="toggleJoinGame"
      data-bs-toggle="tooltip"
      title="Join Game"
      v-if="
        !galaxyStore.currentPlayer &&
        galaxyStore.galaxy?.game.state.status === GameStates.PENDING
      "
    >
      <i class="fas fa-handshake"></i>
    </button>
    <button
      class="btn btn-outline-theme mb-2"
      @click="toggleLeaderboard"
      data-bs-toggle="tooltip"
      title="Leaderboard"
    >
      <i class="fas fa-trophy"></i>
    </button>
    <button
      class="btn btn-outline-theme mb-2"
      @click="toggleReferenceModal"
      data-bs-toggle="tooltip"
      title="Reference"
    >
      <i class="fas fa-book"></i>
    </button>

    <div class="mt-auto d-flex flex-column">
      <button
        class="btn btn-outline-theme mb-2"
        @click="goToProfile"
        data-bs-toggle="tooltip"
        title="Profile"
      >
        <i class="fas fa-user"></i>
      </button>
      <button
        class="btn btn-outline-theme"
        @click="goToMainMenu"
        data-bs-toggle="tooltip"
        title="Main Menu"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGalaxyStore } from "../../stores/galaxy";
import { GameStates } from "../../../../core/src/types/game";

const galaxyStore = useGalaxyStore();

const emit = defineEmits(["toggle-join-game", "toggle-leaderboard", "toggle-reference-modal"]);

const toggleJoinGame = () => {
  emit("toggle-join-game");
};

const toggleLeaderboard = () => {
  emit("toggle-leaderboard");
};

const toggleReferenceModal = () => {
  emit("toggle-reference-modal");
};

const goToMainMenu = () => {
  window.location.href = "/";
};

const goToProfile = () => {
  window.location.href = "/profile";
};
</script>

<style scoped>
.left-sidebar {
  background-color: #212529;
}
</style>
