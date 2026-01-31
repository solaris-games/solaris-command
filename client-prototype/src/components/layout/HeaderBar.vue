<template>
  <div id="header" class="app-header">
    <!-- BEGIN brand -->
    <div class="brand" style="width: unset">
      <router-link to="/games" class="brand-logo">
        <span class="brand-img" style="margin-right: 8px">
          <img src="/favicon_dark.ico" style="margin-left: 12px" />
        </span>
        <span class="brand-text text-success d-none d-md-inline"
          >SOLARIS: COMMAND</span
        >
      </router-link>
    </div>
    <!-- END brand -->

    <!-- Game Time -->
    <div
      v-if="galaxyStore.galaxy"
      class="section-countdown d-flex align-items-center me-auto ms-2"
      @click="toggleLeaderboard"
    >
      <span
        class="fw-bold"
        v-if="galaxyStore.isGameClockRunning && !galaxyStore.isGameStarting"
      >
        [Cycle {{ galaxyStore.galaxy.game.state.cycle }} - Tick
        {{ galaxyStore.galaxy.game.state.tick }}] {{ nextCycleCountdown }}
      </span>
      <span class="fw-bold" v-if="galaxyStore.isGameStarting">
        Game starts in {{ nextCycleCountdown }}
      </span>
      <span class="fw-bold" v-if="!galaxyStore.isGameClockRunning">
        {{ galaxyStore.galaxy.game.state.status }}
      </span>
    </div>

    <!-- Resources -->
    <div
      class="section-resources d-flex align-items-center mx-3"
      v-if="hasUserPlayer"
      @click="toggleLeaderboard"
    >
      <i
        class="fas fa-coins fs-5 me-1 text-warning"
        data-bs-toggle="tooltip"
        title="Your current prestige points"
      ></i>
      <span class="fw-bold">{{ prestigePoints }}</span>
      <span
        class="ms-3 me-1"
        data-bs-toggle="tooltip"
        title="Your current victory points"
        >VP:</span
      >
      <span class="fw-bold">{{ victoryPoints }}</span>
      <span class="fw-bold d-none d-md-inline-block ms-1"
        >/ {{ maxVictoryPoints }}</span
      >

      <!-- Territory -->
      <i
        class="fas fa-globe fs-5 ms-3 me-1 text-info"
        data-bs-toggle="tooltip"
        title="The number of planets you control"
      ></i>
      <span class="fw-bold"
        ><span class="d-none d-md-inline">Planets: </span
        >{{ planetCount }}</span
      >
      <i
        class="fas fa-satellite fs-5 ms-3 me-1 text-info"
        data-bs-toggle="tooltip"
        title="The number of stations you control"
      ></i>
      <span class="fw-bold"
        ><span class="d-none d-md-inline">Stations: </span
        >{{ stationCount }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { GameStates } from "@solaris-command/core/src/types/game";

const galaxyStore = useGalaxyStore();

const emit = defineEmits(["toggle-leaderboard"]);

const toggleLeaderboard = () => {
  emit("toggle-leaderboard");
};

const nextCycleCountdown = ref("Calculating...");
let countdownInterval: ReturnType<typeof setInterval>;

const hasUserPlayer = computed(() => {
  return galaxyStore.currentPlayer != null;
});

const prestigePoints = computed(() => {
  return galaxyStore.currentPlayer?.prestigePoints ?? 0;
});

const victoryPoints = computed(() => {
  return galaxyStore.currentPlayer?.victoryPoints ?? 0;
});

const maxVictoryPoints = computed(() => {
  return galaxyStore.galaxy?.game?.settings?.victoryPointsToWin ?? 0;
});

const planetCount = computed(() => {
  const currentPlayerId = galaxyStore.currentPlayerId;
  if (!currentPlayerId || !galaxyStore.planets) return 0;
  return galaxyStore.planets.filter((p) => p.playerId === currentPlayerId)
    .length;
});

const stationCount = computed(() => {
  const currentPlayerId = galaxyStore.currentPlayerId;
  if (!currentPlayerId || !galaxyStore.stations) return 0;
  return galaxyStore.stations.filter((s) => s.playerId === currentPlayerId)
    .length;
});

onMounted(() => {
  countdownInterval = setInterval(updateCountdowns, 1000);
});

onUnmounted(() => {
  clearInterval(countdownInterval);
});

function updateCountdowns() {
  if (!galaxyStore.galaxy || !galaxyStore.galaxy.game) {
    nextCycleCountdown.value = "N/A";
    return;
  }

  const game = galaxyStore.galaxy.game;

  if (game.state.status === GameStates.STARTING && game.state.startDate) {
    const startDate = new Date(game.state.startDate);
    const now = new Date();
    const timeToStart = startDate.getTime() - now.getTime();

    if (timeToStart > 0) {
      nextCycleCountdown.value = formatMillisecondsToHMS(timeToStart);
    } else {
      nextCycleCountdown.value = "Processing...";
    }

    return;
  }

  const lastTickDate = game.state.lastTickDate
    ? new Date(game.state.lastTickDate)
    : null;
  const tickDurationMS = game.settings.tickDurationMS;
  const ticksPerCycle = game.settings.ticksPerCycle;
  const currentTick = game.state.tick;

  if (lastTickDate && tickDurationMS) {
    const nextTickTime = new Date(lastTickDate.getTime() + tickDurationMS);
    const now = new Date();
    const timeToNextTick = nextTickTime.getTime() - now.getTime();

    const nextCycleTick = ticksPerCycle * (game.state.cycle + 1);
    const ticksRemainingInCycle = nextCycleTick - currentTick;
    const timeToNextCycle =
      timeToNextTick + (ticksRemainingInCycle - 1) * tickDurationMS;

    if (timeToNextCycle > 0) {
      nextCycleCountdown.value = formatMillisecondsToHMS(timeToNextCycle);
    } else {
      nextCycleCountdown.value = "Processing...";
    }
  } else {
    nextCycleCountdown.value = "N/A";
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

<style scoped>
.app-header {
  position: relative;
}
.section-countdown,
.section-resources,
.section-territory {
  cursor: pointer;
}
</style>
