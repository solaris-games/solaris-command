<template>
  <div class="map-overlay-buttons">
    <button
      class="btn mb-2"
      :class="{
        'btn-dark': !mapSettingsStore.showHexGraphics,
        'btn-primary': mapSettingsStore.showHexGraphics,
      }"
      @click="mapSettingsStore.toggleHexGraphics()"
      title="Toggle Hex Graphics"
    >
      <i class="bi bi-map"></i>
    </button>
    <button
      class="btn mb-2"
      :class="{
        'btn-dark': !mapSettingsStore.showHexCoordinates,
        'btn-primary': mapSettingsStore.showHexCoordinates,
      }"
      @click="mapSettingsStore.toggleHexCoordinates()"
      title="Toggle Hex Coordinates"
    >
      <i class="bi bi-pin"></i>
    </button>
    <button
      class="btn mb-2"
      :class="{
        'btn-dark': !mapSettingsStore.showSupply,
        'btn-primary': mapSettingsStore.showSupply,
      }"
      @click="mapSettingsStore.toggleSupply()"
      title="Toggle Supply Network"
    >
      <i class="bi bi-share-fill"></i>
    </button>
    <button
      class="btn mb-2"
      :class="{
        'btn-dark': !mapSettingsStore.showZOC,
        'btn-primary': mapSettingsStore.showZOC,
      }"
      @click="mapSettingsStore.toggleZOC()"
      title="Toggle Zone of Control"
    >
      <i class="bi bi-circle-fill"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";

const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();
</script>

<style scoped>
.map-overlay-buttons {
  position: absolute;
  top: 16px; /* Adjust as needed */
  right: 332px; /* Width of right sidebar (300px) + right padding (16px) + additional margin (16px) */
  z-index: 10;
  display: flex;
  flex-direction: column;
}
</style>
