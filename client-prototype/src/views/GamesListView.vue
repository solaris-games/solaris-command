<template>
  <NavBar />

  <div id="content" class="app-content">
    <h1>Games Lobby</h1>
    <p v-if="gameStore.error" class="text-danger">{{ gameStore.error }}</p>

    <div class="mb-3">
      <h2>My Games</h2>
      <div v-if="gameStore.myGames.length === 0">No active games.</div>
      <div
        v-else
        class="row g-3 row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4"
      >
        <div v-for="game in gameStore.myGames" :key="game._id" class="card">
          <div class="card-body">
            <h3>{{ game.name }}</h3>
            <p>Status: {{ game.state.status }}</p>
            <p>Turn: {{ game.state.tick }}</p>
            <div class="mt-3 d-flex gap-2">
              <button
                @click="$router.push(`/games/${game._id}`)"
                class="btn btn-success"
              >
                Play
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
    </div>

    <div class="mb-3">
      <h2>Open Games</h2>
      <div v-if="gameStore.openGames.length === 0">No open games found.</div>
      <div
        v-else
        class="row g-3 row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4"
      >
        <div v-for="game in gameStore.openGames" :key="game._id" class="card">
          <div class="card-body">
            <h3>{{ game.name }}</h3>
            <p>
              Players: {{ game.state.playerCount }} /
              {{ game.settings.playerCount }}
            </p>

            <div class="mt-3">
              <button
                @click="$router.push(`/games/${game._id}`)"
                class="btn btn-primary"
              >
                View
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useGameStore } from "../stores/game";
import NavBar from "../components/NavBar.vue";

const gameStore = useGameStore();

onMounted(async () => {
  await gameStore.fetchGames();
});
</script>
