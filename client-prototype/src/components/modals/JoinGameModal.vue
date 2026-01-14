<template>
  <div class="join-game-modal bg-dark">
    <div class="modal-content">
      <div class="card bg-dark">
        <div class="card-header fw-bold">
          {{ galaxyStore.galaxy?.game.name }}
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="card-body">
          <p class="text-muted mb-0">
            {{ galaxyStore.galaxy?.game.description }}
          </p>
          <hr />
          <form @submit.prevent="joinGame">
            <div class="mb-3">
              <label for="alias" class="form-label">Alias</label>
              <input
                type="text"
                class="form-control"
                id="alias"
                v-model="alias"
                required
                placeholder="Enter your alias here"
              />
            </div>
            <div class="mb-3">
              <label for="color" class="form-label">Colour</label>
              <select class="form-select" id="color" v-model="color" required>
                <option
                  v-for="c in availableColors"
                  :key="c.key"
                  :value="c.key"
                >
                  {{ c.alias }}
                </option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary w-100">
              Join Game
            </button>
          </form>
          <hr />
          <div class="text-muted small">
            <p>
              The game will begin once all
              <span class="text-info"
                >{{ galaxyStore.galaxy?.game.settings.playerCount }} player
                slots</span
              >
              have been filled.
            </p>
            <p class="mb-0">
              You will be placed in a
              <span class="text-warning">random</span> available slot upon
              joining.
            </p>
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
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useGameStore } from "../../stores/game";
import { PLAYER_COLOR_LOOKUP } from "../../../../core/src/data/player-colors";

const emit = defineEmits(["close"]);
const galaxyStore = useGalaxyStore();
const gameStore = useGameStore();

const alias = ref("");
const color = ref("");

const availableColors = computed(() => {
  const game = galaxyStore.galaxy?.game;
  if (!game) return [];
  const usedColors = galaxyStore.players.map((p) => p.color);
  return Array.from(PLAYER_COLOR_LOOKUP.values()).filter(
    (c) => !usedColors.includes(c.key)
  );
});

const joinGame = async () => {
  const game = galaxyStore.galaxy?.game;
  if (!game) return;

  try {
    await gameStore.joinGame(game._id.toString(), alias.value, color.value);
    emit("close");
    window.location.reload(); // Reload to update player state
  } catch (error) {
    console.error("Failed to join game:", error);
  }
};
</script>

<style scoped>
.join-game-modal {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  z-index: 20;
}
.btn-close {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
