<template>
  <div class="map-overlay-buttons">
    <div class="btn-group">

    <button
      class="btn"
      :class="{
        'btn-dark': !mapSettingsStore.showHexCoordinates,
        'btn-yellow': mapSettingsStore.showHexCoordinates,
      }"
      @click="mapSettingsStore.toggleHexCoordinates()"
      title="Toggle Hex Coordinates"
    >
      <i class="bi bi-grid-3x3"></i>
    </button>
    <button
      class="btn"
      :class="{
        'btn-dark': !mapSettingsStore.showSupply,
        'btn-yellow': mapSettingsStore.showSupply,
      }"
      @click="mapSettingsStore.toggleSupply()"
      title="Toggle Supply Network"
    >
      <i class="bi bi-share-fill"></i>
    </button>
    <button
      class="btn"
      :class="{
        'btn-dark': !mapSettingsStore.showZOC,
        'btn-yellow': mapSettingsStore.showZOC,
      }"
      @click="mapSettingsStore.toggleZOC()"
      title="Toggle Zone of Control"
    >
      <i class="bi bi-circle-fill"></i>
    </button>
    <button
      class="btn"
      :class="{
        'btn-dark': !mapSettingsStore.showHexGraphics,
        'btn-yellow': mapSettingsStore.showHexGraphics,
      }"
      @click="mapSettingsStore.toggleHexGraphics()"
      title="Toggle Hex Graphics"
    >
      <i class="bi bi-map"></i>
    </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMapSettingsStore } from "../../stores/mapSettings";

const mapSettingsStore = useMapSettingsStore();
</script>

<style scoped>
.map-overlay-buttons {
  position: absolute;
  top: 16px;
  right: 324px; /* Width of right sidebar (300px) + right padding (16px) + additional margin (8px) */
  z-index: 10;
  display: flex;
  align-items: end;
  flex-direction: row;
}
</style>
