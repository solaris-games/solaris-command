<template>
  <BaseModal
    :show="show"
    :title="galaxyStore.galaxy?.game.name"
    @close="$emit('close')"
  >
    <div v-if="galaxyStore.galaxy?.game && !winner">
      <div class="game-status">
        <p class="text-muted mb-0">
          Be the first to earn
          <span class="text-warning"
            >{{ galaxyStore.galaxy?.game.settings.victoryPointsToWin }} Victory
            Points</span
          >.
        </p>
      </div>

      <p
        class="mt-3"
        v-if="galaxyStore.galaxy.game.state.status === GameStates.ACTIVE"
      >
        Next tick: {{ nextTickCountdown }}
      </p>

      <hr />
    </div>

    <div class="leaderboard-list" style="max-height: 400px; overflow-y: auto">
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
            <span v-if="player.isReady" class="badge bg-success">READY</span>
            <span v-if="player.status === 'AFK'" class="badge bg-secondary"
              >AFK</span
            >
            <span v-if="player.status === 'DEFEATED'" class="badge bg-danger"
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
              getPlanetCount(player._id.toString()) === 1 ? "planet" : "planets"
            }}
          </div>
        </div>
      </div>
      <div v-else>
        <p class="text-center mb-0">No players in this game.</p>
      </div>
    </div>

    <hr />

    <div class="row mt-auto" v-if="galaxyStore.currentPlayer">
      <div class="col">
        <button
          class="btn btn-outline-danger me-2"
          @click="
            showConfirmation = true;
            confirmationTitle = 'Quit Game';
            confirmationText = 'Are you sure you want to quit the game?';
            onConfirmAction = handleQuitGame;
          "
          v-if="galaxyStore.galaxy?.game.state.status === GameStates.PENDING"
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
      <div class="col-auto">
        <button
          class="btn ms-1"
          :class="{
            'btn-outline-success': !galaxyStore.currentPlayer.isReady,
            'btn-success': galaxyStore.currentPlayer.isReady,
          }"
          @click="handleTogglePlayerReady"
          v-if="
            galaxyStore.currentPlayerId &&
            (galaxyStore.galaxy?.game.state.status === GameStates.PENDING ||
              galaxyStore.galaxy?.game.state.status === GameStates.STARTING ||
              galaxyStore.galaxy?.game.state.status === GameStates.ACTIVE)
          "
          data-bs-toggle="tooltip"
          title="Declare yourself ready for the next tick. When all active players are ready the game will tick early."
        >
          <i class="fas fa-check me-1"></i>I'm ready
        </button>

        <button
          class="btn btn-success ms-1"
          @click="showTradeModal = true"
          v-if="galaxyStore.galaxy?.game.state.status === GameStates.ACTIVE"
          data-bs-toggle="tooltip"
          title="Send prestige"
        >
          <i class="fas fa-coins me-1"></i>Send Prestige
        </button>
        <button
          class="btn btn-primary ms-1"
          @click="showRenownModal = true"
          v-if="galaxyStore.galaxy?.game.state.status === GameStates.COMPLETED"
          data-bs-toggle="tooltip"
          title="Send prestige"
        >
          <i class="fas fa-heart me-1"></i>Send Renown
        </button>
      </div>
    </div>
  </BaseModal>

  <ConfirmationModal
    :show="showConfirmation"
    :title="confirmationTitle"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    {{ confirmationText }}
  </ConfirmationModal>

  <TradePrestigeModal
    :show="showTradeModal"
    @close="showTradeModal = false"
    @success="showTradeModal = false"
  />

  <TradeRenownModal
    :show="showRenownModal"
    @close="showRenownModal = false"
    @success="showRenownModal = false"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useGameStore } from "../../stores/game";
import { useGalaxyStore } from "../../stores/galaxy";
import ConfirmationModal from "./ConfirmationModal.vue";
import BaseModal from "./BaseModal.vue";
import TradePrestigeModal from "./TradePrestigeModal.vue";
import TradeRenownModal from "./TradeRenownModal.vue";
import { GameLeaderboardUtils } from "@solaris-command/core/src/utils/game-leaderboard";
import { GameStates } from "@solaris-command/core/src/types/game";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close"]);
const gameStore = useGameStore();
const galaxyStore = useGalaxyStore();
const showConfirmation = ref(false);
const showTradeModal = ref(false);
const showRenownModal = ref(false);
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

const handleTogglePlayerReady = async () => {
  const game = galaxyStore.galaxy?.game;
  if (!game) return;

  if (!galaxyStore.currentPlayer) {
    return;
  }

  try {
    if (galaxyStore.currentPlayer.isReady) {
      await gameStore.setPlayerNotReady(game._id.toString());

      galaxyStore.currentPlayer.isReady = false;
    } else {
      await gameStore.setPlayerReady(game._id.toString());

      galaxyStore.currentPlayer.isReady = true;
    }
  } catch (error) {
    console.error("Failed to toggle ready status:", error);
  }
};

// Tick countdown
const nextTickCountdown = ref("Calculating...");
let countdownInterval: ReturnType<typeof setInterval>;

onMounted(() => {
  countdownInterval = setInterval(updateCountdowns, 1000);
});

onUnmounted(() => {
  clearInterval(countdownInterval);
});

function updateCountdowns() {
  if (!galaxyStore.galaxy || !galaxyStore.galaxy.game) {
    nextTickCountdown.value = "N/A";
    return;
  }

  const game = galaxyStore.galaxy.game;

  const now = new Date();
  const nextTickDate = new Date(game.state.nextTickDate!);

  if (now.getTime() >= nextTickDate.getTime()) {
    nextTickCountdown.value = "Processing...";
    return;
  }

  const timeToNextTick = nextTickDate.getTime() - now.getTime();

  if (now.getTime() >= nextTickDate.getTime()) {
    nextTickCountdown.value = "Processing...";
  } else {
    nextTickCountdown.value = formatMillisecondsToHMS(timeToNextTick);
  }
}

function formatMillisecondsToHMS(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  const pad = (num: number) => (num < 10 ? "0" + num : num);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
</script>
