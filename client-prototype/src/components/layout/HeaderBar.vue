<template>
  <div class="d-flex align-items-center bg-dark text-white p-2" style="height: 60px;">
    <!-- Brand/Logo -->
    <div class="fs-5 fw-bold text-success me-3">SOLARIS: COMMAND</div>

    <!-- Game Time -->
    <div v-if="galaxyStore.galaxy" class="d-flex align-items-center me-auto">
      <span class="fw-bold">
        [Cycle {{ galaxyStore.galaxy.game.state.cycle }} - Tick {{ galaxyStore.galaxy.game.state.tick }}] {{ nextCycleCountdown }}
      </span>
    </div>

    <!-- Resources -->
    <div class="d-flex align-items-center mx-3">
      <i class="bi bi-currency-dollar fs-5 me-1 text-warning"></i>
      <span class="fw-bold">{{ prestigePoints }}</span>
      <span class="ms-3 me-1">VP:</span>
      <span class="fw-bold">{{ victoryPoints }} / {{ maxVictoryPoints }}</span>
    </div>

    <!-- Territory -->
    <div class="d-flex align-items-center mx-3">
      <i class="bi bi-globe fs-5 me-1 text-info"></i>
      <span class="fw-bold">Planets: {{ planetCount }}</span>
      <i class="bi bi-cpu fs-5 ms-3 me-1 text-info"></i>
      <span class="fw-bold">Stations: {{ stationCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useGalaxyStore } from '../../stores/galaxy';

const galaxyStore = useGalaxyStore();

const nextCycleCountdown = ref("Calculating...");
let countdownInterval: ReturnType<typeof setInterval>;

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
  return galaxyStore.planets.filter(p => p.playerId === currentPlayerId).length;
});

const stationCount = computed(() => {
  const currentPlayerId = galaxyStore.currentPlayerId;
  if (!currentPlayerId || !galaxyStore.stations) return 0;
  return galaxyStore.stations.filter(s => s.playerId === currentPlayerId).length;
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

    const ticksRemainingInCycle = ticksPerCycle - currentTick + 1;
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
/* Scoped styles for HeaderBar if needed, but Bootstrap utilities should handle most */
/* z-index can be added if it overlaps with anything */
</style>
