<template>
  <div v-if="selectedHex" class="card bg-dark mb-3">
    <div class="card-body">
      <div class="row">
        <div class="col-6">
          <p class="mb-1"><i class="bi bi-grid-3x3"></i> Q:{{ selectedHex.location.q }} R:{{ selectedHex.location.r }}</p>
          <p class="mb-0"><i class="bi bi-terrain"></i> <span class="text-warning">{{ terrainFriendlyNames[selectedHex.terrain] }}</span></p>
        </div>
        <div class="col-6">
          <div v-if="selectedPlanet">
            <p class="mb-1"><i class="bi bi-globe"></i> {{ selectedPlanet.name }}</p>
            <p class="mb-0"><i class="bi bi-person-fill"></i> 
              {{
                selectedPlanet.playerId === galaxyStore.currentPlayerId
                  ? "You"
                  : selectedPlanet.playerId
                  ? "Enemy"
                  : "Unowned"
              }}
            </p>
          </div>
          <div v-else-if="selectedStation">
            <p class="mb-1"><i class="bi bi-cpu"></i> Station</p>
            <p class="mb-0"><i class="bi bi-person-fill"></i>
                {{
                    selectedStation.playerId === galaxyStore.currentPlayerId
                    ? "You"
                    : "Enemy"
                }}
            </p>
          </div>
        </div>
      </div>
      <div v-if="selectedHex.playerId === galaxyStore.currentPlayerId && !selectedStation" class="mt-3">
        <button
          class="btn btn-primary w-100"
          @click="galaxyStore.buildStation()"
        >
          <i class="bi bi-gear"></i> Build Station (${{ CONSTANTS.STATION_PRESTIGE_COST }})
        </button>
      </div>
      <div v-else-if="selectedStation && selectedStation.playerId === galaxyStore.currentPlayerId" class="mt-3">
        <button
          class="btn btn-danger w-100"
          @click="galaxyStore.deleteStation()"
        >
          <i class="bi bi-trash"></i> Scuttle Station
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";
import { CONSTANTS } from "@solaris-command/core/src/data/constants";

const galaxyStore = useGalaxyStore();
const selectedHex = computed(() => galaxyStore.selectedHex);
const selectedPlanet = computed(() => galaxyStore.selectedPlanet);
const selectedStation = computed(() => galaxyStore.selectedStation);
const selectedUnit = computed(() => galaxyStore.selectedUnit);

const terrainFriendlyNames: Record<TerrainTypes, string> = {
  [TerrainTypes.EMPTY]: "Empty",
  [TerrainTypes.ASTEROID_FIELD]: "Asteroid Field",
  [TerrainTypes.DEBRIS_FIELD]: "Debris Field",
  [TerrainTypes.NEBULA]: "Nebula",
  [TerrainTypes.GAS_CLOUD]: "Gas Cloud",
  [TerrainTypes.INDUSTRIAL_ZONE]: "Industrial Zone",
  [TerrainTypes.RADIATION_STORM]: "Radiation Storm",
  [TerrainTypes.GRAVITY_WELL]: "Gravity Well",
};
</script>

<style scoped>
.card {
  color: #fff;
}
.row p {
    font-size: 0.9rem;
}
</style>
