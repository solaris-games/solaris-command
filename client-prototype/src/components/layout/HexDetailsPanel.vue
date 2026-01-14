<template>
  <div v-if="selectedHex">
    <div class="card" :style="panelStyle">
      <div class="card-body">
        <div class="row">
          <div class="col">
            <p class="mb-0" v-if="owner">
              <i class="bi bi-person-fill"></i>
              {{ owner?.alias }}
            </p>
          </div>
          <div class="col-auto">
            <div v-if="selectedPlanet">
              <p class="mb-0">
                <i class="bi bi-globe"></i> {{ selectedPlanet.name }}
              </p>
            </div>
            <div v-else-if="selectedStation">
              <p class="mb-0"><i class="bi bi-cpu"></i> Station</p>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <p class="mb-0">
              <i class="bi bi-hexagon"></i>
              {{ terrainFriendlyNames[selectedHex.terrain] }}
            </p>
          </div>
          <div class="col-auto">
            <p class="mb-0">
              <i class="bi bi-grid-3x3"></i> Q:{{ selectedHex.location.q }} R:{{
                selectedHex.location.r
              }}
            </p>
          </div>
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
  <div v-else>
    <div class="card bg-dark">
      <div class="card-body">
        No hex selected.
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
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

const galaxyStore = useGalaxyStore();
const selectedHex = computed(() => galaxyStore.selectedHex);
const selectedPlanet = computed(() => galaxyStore.selectedPlanet);
const selectedStation = computed(() => galaxyStore.selectedStation);

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

const owner = computed(() => {
  if (!selectedHex.value || !galaxyStore.playerLookup) return null;
  return galaxyStore.playerLookup.get(String(selectedHex.value.playerId))!;
});

const panelStyle = computed(() => {
  if (owner.value) {
    const color = PLAYER_COLOR_LOOKUP.get(owner.value.color);
    if (color) {
      return {
        backgroundColor: color.background,
        color: color.foreground,
      };
    }
  }
  return {
    backgroundColor: "#212529",
    color: "#fff",
  };
});
</script>

<style scoped>
.card {
  color: #fff;
}
.row p {
  font-size: 0.9rem;
}
</style>
