<template>
  <div class="leaderboard-modal">
    <div class="modal-content">
      <div class="card p-1">
        <div class="card-header bg-dark fw-bold">
          {{ galaxyStore.galaxy?.game.name }}

          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
            data-bs-toggle="tooltip"
            title="Close this dialog"
          ></button>
        </div>
        <div class="card-body bg-dark">
          <div v-if="galaxyStore.galaxy?.game && !winner">
            <div class="game-status">
              <p class="text-muted mb-0">
                Be the first to earn
                <span class="text-warning"
                  >{{
                    galaxyStore.galaxy?.game.settings.victoryPointsToWin
                  }}
                  Victory Points</span
                >.
              </p>
            </div>

            <hr />
          </div>

          <div
            class="leaderboard-list"
            style="max-height: 400px; overflow-y: auto"
          >
            <div v-if="winner" class="winner-section text-center mb-3">
              <h4>
                <i class="fas fa-crown text-yellow"></i> Winner
                <i class="fas fa-crown text-yellow"></i>
              </h4>
              <div
                class="player-entry p-2 rounded"
                :style="{
                  backgroundColor: getPlayerColor(winner.color)?.background,
                  color: getPlayerColor(winner.color)?.foreground,
                }"
              >
                <h5 class="mb-0">
                  <strong>{{ winner.alias }}</strong>
                </h5>
              </div>
              <hr />
            </div>

            <div
              v-if="leaderboard.length > 0"
              v-for="player in leaderboard"
              :key="player._id.toString()"
              class="player-entry p-2 mb-2 rounded"
              :style="{
                backgroundColor: getPlayerColor(player.color)?.background,
                color: getPlayerColor(player.color)?.foreground,
              }"
            >
              <div class="row">
                <div class="col">
                  <i
                    class="fas me-1"
                    :class="{
                      'fa-user': !player.isAIControlled,
                      'fa-robot': player.isAIControlled,
                    }"
                  ></i>
                  <strong>{{ player.alias }}</strong>
                </div>
                <div class="col-auto">
                  <span
                    v-if="player.status === 'AFK'"
                    class="badge bg-secondary"
                    >AFK</span
                  >
                  <span
                    v-if="player.status === 'DEFEATED'"
                    class="badge bg-danger"
                    >DEFEATED</span
                  >
                </div>
              </div>
              <div class="row mt-1">
                <div class="col">
                  <i class="fas fa-star"></i> {{ player.victoryPoints }} VP
                  <i class="fas fa-globe ms-2"></i>
                  {{ getPlanetCount(player._id.toString()) }}
                  {{
                    getPlanetCount(player._id.toString()) === 1
                      ? "planet"
                      : "planets"
                  }}
                </div>
              </div>
            </div>
            <div v-else>
              <p class="text-center mb-0">No players in this game.</p>
            </div>
          </div>

          <hr />

          <div class="mt-auto" v-if="galaxyStore.currentPlayer">
            <button
              class="btn btn-outline-danger"
              @click="
                showConfirmation = true;
                confirmationTitle = 'Quit Game';
                confirmationText = 'Are you sure you want to quit the game?';
                onConfirmAction = handleQuitGame;
              "
              v-if="
                galaxyStore.galaxy?.game.state.status === GameStates.PENDING
              "
              data-bs-toggle="tooltip"
              title="Quit the game"
            >
              Quit Game
            </button>
            <button
              class="btn btn-outline-danger"
              @click="
                showConfirmation = true;
                confirmationTitle = 'Concede Game';
                confirmationText = 'Are you sure you want to concede?';
                onConfirmAction = handleConcedeGame;
              "
              v-if="galaxyStore.galaxy?.game.state.status === GameStates.ACTIVE"
              data-bs-toggle="tooltip"
              title="Concede the game"
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
  <ConfirmationModal
    :show="showConfirmation"
    :title="confirmationTitle"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    {{ confirmationText }}
  </ConfirmationModal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useGameStore } from "../../stores/game";
import { useGalaxyStore } from "../../stores/galaxy";
import ConfirmationModal from "./ConfirmationModal.vue";
import { GameLeaderboardUtils } from "@solaris-command/core/src/utils/game-leaderboard";
import { GameStates } from "@solaris-command/core/src/types/game";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

const emit = defineEmits(["close"]);
const gameStore = useGameStore();
const galaxyStore = useGalaxyStore();
const showConfirmation = ref(false);
const confirmationTitle = ref("");
const confirmationText = ref("");
let onConfirmAction = () => {};

const leaderboard = computed(() => {
  if (!galaxyStore.galaxy) return [];
  return GameLeaderboardUtils.getLeaderboard(
    galaxyStore.galaxy.players as any,
    galaxyStore.galaxy.planets,
    galaxyStore.galaxy.units as any,
  );
});

const winner = computed(() => {
  if (galaxyStore.galaxy?.game.state.status !== GameStates.COMPLETED)
    return null;
  return leaderboard.value[0];
});

const getPlayerColor = (colorKey: string) => {
  return PLAYER_COLOR_LOOKUP.get(colorKey);
};

const getPlanetCount = (playerId: string) => {
  if (!galaxyStore.galaxy) return 0;
  return galaxyStore.galaxy.planets.filter(
    (p) => p.playerId?.toString() === playerId,
  ).length;
};

const onConfirm = () => {
  onConfirmAction();
  showConfirmation.value = false;
};

const onCancel = () => {
  showConfirmation.value = false;
};

const handleQuitGame = async () => {
  const game = galaxyStore.galaxy?.game;
  if (!game) return;
  try {
    await gameStore.leaveGame(game._id.toString());
    emit("close");
    window.location.href = "/";
  } catch (error) {
    console.error("Failed to quit game:", error);
  }
};

const handleConcedeGame = async () => {
  const game = galaxyStore.galaxy?.game;
  if (!game) return;
  try {
    await gameStore.concedeGame(game._id.toString());
    emit("close");
  } catch (error) {
    console.error("Failed to concede game:", error);
  }
};
</script>

<style scoped>
.leaderboard-modal {
  display: flex;
  flex-direction: column;
}
.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.btn-close {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
