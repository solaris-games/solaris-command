<template>
  <v-group
    v-if="mapSettingsStore.showHexCoordinates"
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <Coordinate
      v-for="hex in galaxyStore.hexes"
      :key="`hex-${hex.location.q},${hex.location.r}`"
      :hex="hex"
    />
  </v-group>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";
import Coordinate from "./Coordinate.vue";

const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

// -----
// Caching
const groupRef = ref(null);

onUnmounted(() => {
  // @ts-ignore
  groupRef.value?.getNode().clearCache();
});

onMounted(() => {
  // @ts-ignore
  groupRef.value?.getNode().clearCache();
  // @ts-ignore
  groupRef.value?.getNode().cache();
});

onUpdated(() => {
  // @ts-ignore
  groupRef.value?.getNode().clearCache();
  // @ts-ignore
  groupRef.value?.getNode().cache();
});
// -----
</script>
