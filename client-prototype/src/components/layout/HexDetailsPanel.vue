<template>
  <div class="card p-1 mb-1" v-if="selectedHex">
    <div class="card-body bg-opacity-95 p-2" :style="panelStyle">
      <div class="row">
        <div class="col">
          <p class="mb-0" v-if="owner">
            <i
              class="fas me-1"
              :class="{
                'fa-user': !owner?.isAIControlled,
                'fa-robot': owner?.isAIControlled,
              }"
            ></i>
            <strong>{{ owner?.alias }}</strong>
          </p>
          <p class="mb-0" v-else>
            <i class="fas fa-user"></i>
            <i>Unowned</i>
          </p>
        </div>
        <div class="col-auto">
          <div v-if="selectedPlanet">
            <p class="mb-0">
              <i class="fas fa-globe"></i> {{ selectedPlanet.name }}
              <span v-if="isUserOwner">(<i class="fas fa-coins"></i> {{ prestigeIncome }})</span>
            </p>
          </div>
          <div v-else-if="selectedStation">
            <p class="mb-0"><i class="fas fa-satellite"></i> Station</p>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <p class="mb-0">
            <i class="fas fa-layer-group"></i>
            {{ terrainFriendlyNames[selectedHex.terrain] }}
          </p>
        </div>
        <div class="col-auto">
          <p class="mb-0">
            <i class="fas fa-table-cells-large"></i> <LocationLink :coords="selectedHex.location" :text-class="null" />
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
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import LocationLink from "../LocationLink.vue";
import { PlanetUtils } from "@solaris-command/core/src/utils/planet-utils";

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

const isUserOwner = computed(() => {
  return galaxyStore.currentPlayerId && owner.value && String(owner.value._id) === String(galaxyStore.currentPlayerId)
})

const prestigeIncome = computed(() => {
  if (!selectedPlanet.value || !isUserOwner.value) {
    return null
  }

  const playerCapitals = galaxyStore.planets.filter(p => p.isCapital && p.playerId && String(p.playerId) === String(galaxyStore.currentPlayerId))

  return PlanetUtils.calculatePlanetPrestigeIncome(selectedPlanet.value, playerCapitals)
})

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
.row p {
  font-size: 0.9rem;
}
</style>
