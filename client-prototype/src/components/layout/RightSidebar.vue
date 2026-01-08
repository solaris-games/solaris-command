<template>
  <div class="bg-dark text-white p-3 d-flex flex-column" style="width: 300px">
    <!-- Toggle Buttons Section -->
    <div class="mb-3">
      <h4>Map Overlays</h4>
      <div class="d-flex justify-content-around">
        <button
          class="btn btn-secondary flex-grow-1 mx-1"
          :class="{ 'btn-success': galaxyStore.showSupply }"
          @click="galaxyStore.toggleSupply()"
          title="Toggle Supply Network"
        >
          <i class="bi bi-share-fill"></i> Supply
        </button>
        <button
          class="btn btn-secondary flex-grow-1 mx-1"
          :class="{ 'btn-success': galaxyStore.showZOC }"
          @click="galaxyStore.toggleZOC()"
          title="Toggle Zone of Control"
        >
          <i class="bi bi-circle-fill"></i> ZOC
        </button>
      </div>
    </div>

    <hr class="my-3" />

    <!-- Game Time Status -->
    <div class="mb-3">
      <h4>Game Time</h4>
      <div v-if="galaxyStore.galaxy">
        <p class="mb-1">
          Cycle:
          <span class="fw-bold">{{ galaxyStore.galaxy.game.state.cycle }}</span>
        </p>
        <p class="mb-1">
          Tick:
          <span class="fw-bold"
            >{{ galaxyStore.galaxy.game.state.tick }} /
            {{ galaxyStore.galaxy.game.settings.ticksPerCycle }}</span
          >
        </p>
        <p class="mb-1">
          Next Tick In: <span class="fw-bold">{{ nextTickCountdown }}</span>
        </p>
        <p class="mb-1">
          Next Cycle In: <span class="fw-bold">{{ nextCycleCountdown }}</span>
        </p>
      </div>
      <div v-else>
        <p>Loading game time...</p>
      </div>
    </div>

    <hr class="my-3" />

    <!-- Player Units List -->
    <div class="flex-grow-1 overflow-auto">
      <h4>My Units</h4>
      <div v-if="sortedPlayerUnits.length === 0">
        <p>No units owned.</p>
      </div>
      <div v-else class="list-group">
        <a
          href="#"
          v-for="unit in sortedPlayerUnits"
          :key="String(unit._id)"
          class="list-group-item list-group-item-action bg-secondary text-white border-dark"
          :class="{
            'active bg-info':
              galaxyStore.selectedUnit &&
              String(galaxyStore.selectedUnit._id) === String(unit._id),
          }"
          @click="selectUnit(unit)"
        >
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">{{ unit.catalogId }}</h6>
            <small class="text-white-50"
              >{{ unit.state.status }}
              <span v-if="!unit.supply.isInSupply">(OOS)</span></small
            >
          </div>
          <p class="mb-1 small">
            Q:{{ unit.location.q }} R:{{ unit.location.r }}
          </p>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api";
import { UnitStatus } from "@solaris-command/core/src/types/unit";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const galaxyStore = useGalaxyStore();

const nextTickCountdown = ref("Calculating...");
const nextCycleCountdown = ref("Calculating...");
let countdownInterval: ReturnType<typeof setInterval>;

const sortedPlayerUnits = computed(() => {
  const currentPlayerId = galaxyStore.currentPlayerId;
  if (!currentPlayerId || !galaxyStore.units) return [];

  const playerUnits = galaxyStore.units.filter(
    (u) => u.playerId === currentPlayerId
  );

  // Sort by out of supply first, then idle, then everything else
  return [...playerUnits].sort((a, b) => {
    // Out of supply comes first
    if (!a.supply.isInSupply && b.supply.isInSupply) return -1;
    if (a.supply.isInSupply && !b.supply.isInSupply) return 1;

    // Then idle units
    if (
      a.state.status === UnitStatus.IDLE &&
      b.state.status !== UnitStatus.IDLE
    )
      return -1;
    if (
      a.state.status !== UnitStatus.IDLE &&
      b.state.status === UnitStatus.IDLE
    )
      return 1;

    // Otherwise, alphabetical by name
    return a.catalogId.localeCompare(b.catalogId);
  });
});

function selectUnit(unit: APIUnit) {
  // Mock hex selection for unit for now, as selectHex handles all selection
  // This will eventually be replaced by a direct selectUnit action
  const hex = galaxyStore.hexes.find(
    (h) => h.location.q === unit.location.q && h.location.r === unit.location.r
  );
  if (hex) {
    galaxyStore.selectHex(hex);
  }
}

onMounted(() => {
  countdownInterval = setInterval(updateCountdowns, 1000);
});

onUnmounted(() => {
  clearInterval(countdownInterval);
});

function updateCountdowns() {
  if (!galaxyStore.galaxy || !galaxyStore.galaxy.game) {
    nextTickCountdown.value = "N/A";
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
  const currentCycle = game.state.cycle;

  if (lastTickDate && tickDurationMS) {
    const nextTickTime = new Date(lastTickDate.getTime() + tickDurationMS);
    const now = new Date();
    const timeToNextTick = nextTickTime.getTime() - now.getTime();

    if (timeToNextTick > 0) {
      nextTickCountdown.value = formatMillisecondsToHMS(timeToNextTick);
    } else {
      nextTickCountdown.value = "Processing...";
    }

    // Calculate next cycle time
    // Ticks are 1-based, so for currentTick 1 and ticksPerCycle 5,
    // (5 - 1) + 1 = 5 ticks remaining * tickDurationMS
    const ticksRemainingInCycle = ticksPerCycle - currentTick + 1;
    const timeToNextCycle =
      timeToNextTick + (ticksRemainingInCycle - 1) * tickDurationMS; // Subtract 1 because nextTickTime already accounts for one tick

    if (timeToNextCycle > 0) {
      nextCycleCountdown.value = formatMillisecondsToHMS(timeToNextCycle);
    } else {
      nextCycleCountdown.value = "Processing...";
    }
  } else {
    nextTickCountdown.value = "N/A";
    nextCycleCountdown.value = "N/A";
  }
}

function formatMillisecondsToHMS(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  const pad = (num: number) => (num < 10 ? "0" + num : num);

  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}
</script>

<style scoped>
/* Add any specific styles for RightSidebar here */
/* The z-index-10 class was moved from GalaxyView */
</style>
