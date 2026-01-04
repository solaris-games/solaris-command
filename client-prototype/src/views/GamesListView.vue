<template>
  <div class="games-view">
    <NavBar />
    <div class="content">
      <h1>Games Lobby</h1>
      <p v-if="gameStore.error" class="error">{{ gameStore.error }}</p>

      <div class="section">
        <h2>My Games</h2>
        <div v-if="gameStore.myGames.length === 0">No active games.</div>
        <div v-else class="game-grid">
          <div v-for="game in gameStore.myGames" :key="game._id" class="game-card">
            <h3>{{ game.name }}</h3>
            <p>Status: {{ game.state.status }}</p>
            <p>Turn: {{ game.state.tick }}</p>
            <div class="actions">
               <button @click="$router.push(`/games/${game._id}`)" class="play-btn">Play</button>
               <button v-if="game.state.status === 'PENDING'" @click="gameStore.leaveGame(game._id)" class="warn-btn">Leave</button>
               <button v-if="game.state.status === 'ACTIVE'" @click="gameStore.concedeGame(game._id)" class="danger-btn">Concede</button>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Open Games</h2>
        <div v-if="gameStore.openGames.length === 0">No open games found.</div>
        <div v-else class="game-grid">
          <div v-for="game in gameStore.openGames" :key="game._id" class="game-card">
             <h3>{{ game.name }}</h3>
             <p>Players: {{ game.state.playerCount }} / {{ game.settings.playerCount }}</p>

             <!-- Only render form if inputs initialized -->
             <div v-if="joinInputs[game._id]" class="join-form">
               <input v-model="joinInputs[game._id]!.alias" placeholder="Alias" />
               <!-- TODO: This should be a select of color options in `core/src/data/player-colors.ts` -->
               <input v-model="joinInputs[game._id]!.color" type="color" />
               <button @click="handleJoin(game._id)">Join</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useGameStore } from '../stores/game';
import NavBar from '../components/NavBar.vue';

const gameStore = useGameStore();
const joinInputs = reactive<Record<string, { alias: string, color: string }>>({});

onMounted(async () => {
  await gameStore.fetchGames();
  // Init inputs
  gameStore.openGames.forEach(g => {
    // Force reactivity update
    joinInputs[g._id] = { alias: 'Commander', color: '#ff0000' };
  });
});

async function handleJoin(gameId: string) {
  const input = joinInputs[gameId];
  if (!input) return;
  const { alias, color } = input;
  await gameStore.joinGame(gameId, alias, color);
}
</script>

<style scoped>
.games-view {
  min-height: 100vh;
  background: #121212;
}
.content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
.game-card {
  background: #1e1e1e;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #333;
}
.actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}
.play-btn { background: #4CAF50; border: none; padding: 0.5rem 1rem; color: white; cursor: pointer; }
.warn-btn { background: #FF9800; border: none; padding: 0.5rem 1rem; color: white; cursor: pointer; }
.danger-btn { background: #F44336; border: none; padding: 0.5rem 1rem; color: white; cursor: pointer; }

.join-form {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}
.join-form input {
  padding: 0.25rem;
}
</style>
