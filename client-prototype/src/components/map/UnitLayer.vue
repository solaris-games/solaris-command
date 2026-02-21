<template>
  <v-group
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <UnitCounter
      v-if="mapSettingsStore.showUnits"
      v-for="unit in galaxyStore.units"
      :key="`unit-${unit.location.q},${unit.location.r}`"
      :config="getHexConfig(unit.location)"
      :unit="unit"
    />
  </v-group>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";
import UnitCounter from "./UnitCounter.vue";
import { HexCoords } from "@solaris-command/core/src/types/geometry";

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

function getHexConfig(location: HexCoords) {
  const { x, y } = hexToPixel(location.q, location.r, HEX_SIZE);
  return {
    x: Math.floor(x - HEX_SIZE / 2) - 4,
    y: Math.floor(y - HEX_SIZE / 2) - 4,
  };
}

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
