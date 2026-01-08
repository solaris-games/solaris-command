<template>
  <div class="d-flex align-items-center bg-dark text-white p-2" style="height: 60px;">
    <!-- Brand/Logo (Optional - if needed based on the screenshot, otherwise keep it clean) -->
    <div class="me-auto fs-5 fw-bold text-success">SOLARIS: COMMAND</div>

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
import { computed } from 'vue';
import { useGalaxyStore } from '../../stores/galaxy';

const galaxyStore = useGalaxyStore();

const prestigePoints = computed(() => {
  return galaxyStore.currentPlayer?.prestigePoints ?? 0;
});

const victoryPoints = computed(() => {
  return galaxyStore.currentPlayer?.victoryPoints ?? 0;
});

const maxVictoryPoints = computed(() => {
    // Assuming max victory points might be in game settings or hardcoded
    // For now, let's use a placeholder or look it up from galaxy.game.settings
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
</script>

<style scoped>
/* Scoped styles for HeaderBar if needed, but Bootstrap utilities should handle most */
/* z-index can be added if it overlaps with anything */
</style>
