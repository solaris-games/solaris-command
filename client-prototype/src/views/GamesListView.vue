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
              <button
                v-if="game.state.status === 'PENDING'"
                @click="gameStore.leaveGame(game._id)"
                class="btn btn-danger"
              >
                Leave
              </button>
              <button
                v-if="game.state.status === 'ACTIVE'"
                @click="gameStore.concedeGame(game._id)"
                class="btn btn-danger"
              >
                Concede
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

            <!-- Only render form if inputs initialized -->
            <div v-if="joinInputs[game._id]" class="mt-3 d-flex gap-2">
              <input
                v-model="joinInputs[game._id]!.alias"
                placeholder="Alias"
                class="form-control"
              />
              <select v-model="joinInputs[game._id]!.color" class="form-select">
                <optgroup
                  v-for="group in PLAYER_COLORS"
                  :key="group.group"
                  :label="group.group"
                >
                  <option
                    v-for="color in group.colours"
                    :key="color.key"
                    :value="color.key"
                  >
                    {{ group.group }} - {{ color.alias }}
                  </option>
                </optgroup>
              </select>
              <button @click="handleJoin(game._id)" class="btn btn-success">
                Join
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
import { onMounted, reactive } from "vue";
import { useGameStore } from "../stores/game";
import { PLAYER_COLORS } from "@solaris-command/core/src/data/player-colors";
import NavBar from "../components/NavBar.vue";

const gameStore = useGameStore();
const joinInputs = reactive<Record<string, { alias: string; color: string }>>(
  {}
);

onMounted(async () => {
  await gameStore.fetchGames();
  // Init inputs
  gameStore.openGames.forEach((g) => {
    // Force reactivity update
    joinInputs[g._id] = { alias: "Commander", color: "red-red" };
  });
});

async function handleJoin(gameId: string) {
  const input = joinInputs[gameId];
  if (!input) return;
  const { alias, color } = input;
  await gameStore.joinGame(gameId, alias, color);
}
</script>
