<template>
  <BaseModal
    :show="show"
    :title="galaxyStore.galaxy?.game.name"
    @close="$emit('close')"
  >
    <div class="join-game-content">
      <p class="text-muted mb-0">
        {{ galaxyStore.galaxy?.game.description }}
      </p>
      <hr />
      <form @submit.prevent="joinGame">
        <div class="form-group mb-3">
          <label for="alias" class="form-label"><strong>Alias</strong></label>
          <input
            type="text"
            class="form-control"
            id="alias"
            v-model="alias"
            required
            placeholder="Enter your alias here"
          />
        </div>
        <div class="form-group mb-3">
          <label for="color" class="form-label"><strong>Colour</strong></label>
          <select class="form-select" id="color" v-model="color" required>
            <option v-for="c in availableColors" :key="c.key" :value="c.key">
              {{ c.alias }}
            </option>
          </select>
        </div>
        <button
          type="submit"
          class="btn btn-primary w-100"
          data-bs-toggle="tooltip"
          title="Join the game with your chosen alias and color"
        >
          Join Game
        </button>
      </form>
      <hr />
      <div class="text-muted small">
        <p>
          The game will begin once all
          <span class="text-info"
            >{{ galaxyStore.galaxy?.game.settings.playerCount }} player slots</span
          >
          have been filled.
        </p>
        <p class="mb-0">
          You will be placed in a
          <span class="text-warning">random</span> available slot upon joining.
        </p>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useGameStore } from "../../stores/game";
import { PLAYER_COLOR_LOOKUP } from "../../../../core/src/data/player-colors";
import { useAuthStore } from "../../stores/auth";
import BaseModal from "./BaseModal.vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close"]);
const galaxyStore = useGalaxyStore();
const gameStore = useGameStore();
const authStore = useAuthStore();

const alias = ref(authStore.user?.username ?? "");
const color = ref("");

const availableColors = computed(() => {
  const game = galaxyStore.galaxy?.game;
  if (!game) return [];
  const usedColors = galaxyStore.players.map((p) => p.color);
  return Array.from(PLAYER_COLOR_LOOKUP.values()).filter(
    (c) => !usedColors.includes(c.key),
  );
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      alias.value = authStore.user?.username ?? "";
      if (availableColors.value.length > 0) {
        color.value = availableColors.value[0].key;
      }
    }
  },
);

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
