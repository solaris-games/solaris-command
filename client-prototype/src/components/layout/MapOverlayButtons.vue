<template>
  <div class="map-overlay-buttons mb-2">
    <div class="btn-group">
      <button
        class="btn"
        :class="{
          'btn-dark': !mapSettingsStore.showHexCoordinates,
          'btn-yellow': mapSettingsStore.showHexCoordinates,
        }"
        @click="mapSettingsStore.toggleHexCoordinates()"
        data-bs-toggle="tooltip"
        title="Toggle Hex Coordinates"
      >
        <i class="fas fa-table-cells-large"></i>
      </button>
      <button
        class="btn"
        :class="{
          'btn-dark': !mapSettingsStore.showSupply,
          'btn-yellow': mapSettingsStore.showSupply,
        }"
        @click="mapSettingsStore.toggleSupply()"
        data-bs-toggle="tooltip"
        title="Toggle Supply Network"
      >
        <i class="fas fa-circle-nodes"></i>
      </button>
      <button
        class="btn"
        :class="{
          'btn-dark': !mapSettingsStore.showZOC,
          'btn-yellow': mapSettingsStore.showZOC,
        }"
        @click="mapSettingsStore.toggleZOC()"
        data-bs-toggle="tooltip"
        title="Toggle Zone of Control"
      >
        <i class="fas fa-circle-dot"></i>
      </button>
      <button
        class="btn"
        :class="{
          'btn-dark': !mapSettingsStore.showHexGraphics,
          'btn-yellow': mapSettingsStore.showHexGraphics,
        }"
        @click="mapSettingsStore.toggleHexGraphics()"
        data-bs-toggle="tooltip"
        title="Toggle Hex Graphics"
      >
        <i class="fas fa-map"></i>
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
  margin-right: auto;
  z-index: 10;
  display: flex;
  align-items: end;
  flex-direction: column;
}
</style>
