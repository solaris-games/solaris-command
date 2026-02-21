<template>
  <v-group
    v-if="mapSettingsStore.showZOC"
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <v-circle
      v-for="source in zocSources"
      :key="source.id"
      :config="getZOCHexCircleConfig(source)"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

// Constants for prototype supply viz
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);

const zocSources = computed(() => {
  const sources: {
    id: string;
    x: number;
    y: number;
    range: number;
  }[] = [];

  if (galaxyStore.currentPlayerId == null) {
    return sources;
  }

  for (const hex of galaxyStore.hexes) {
    if (hex.zoc.length) {
      const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
      sources.push({ id: `h-${hex._id}`, x, y, range: 0.4 });
    }
  }

  return sources;
});

function getZOCHexCircleConfig(source: {
  x: number;
  y: number;
  range: number;
}) {
  return {
    x: source.x,
    y: source.y,
    radius: (source.range * HEX_WIDTH) / 2,
    fill: "rgba(255, 255, 255, 1)",
    stroke: "rgba(0, 0, 0, 1)",
    strokeWidth: 6,
    listening: false, // Click through
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
