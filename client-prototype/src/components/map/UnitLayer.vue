<template>
  <v-group
    v-if="mapSettingsStore.showUnits"
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <v-group
      v-for="hex in galaxyStore.hexes"
      :key="`unit-${hex.location.q},${hex.location.r}`"
      :config="getHexConfig(hex)"
    >
      <UnitCounter v-if="getUnitAt(hex)" :unit="getUnitAt(hex)!" />
    </v-group>
  </v-group>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import UnitCounter from "./UnitCounter.vue";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

function getUnitAt(hex: APIHex) {
  return galaxyStore.units.find(
    (u) => u.location.q === hex.location.q && u.location.r === hex.location.r,
  );
}

function getHexConfig(hex: APIHex) {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  return { x, y };
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
