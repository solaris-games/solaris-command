<template>
  <v-group v-if="mapSettingsStore.showMPCosts">
    <v-group v-for="source in hexSources" :key="source.id">
      <v-circle :config="getHexCircleConfig(source)" />
      <v-text :config="getTextConfig(source)" />
    </v-group>
  </v-group>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";
import { MapUtils } from "@solaris-command/core/src/utils/map-utils";

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

// Constants for prototype supply viz
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);

const hexSources = computed(() => {
  const sources: {
    id: string;
    x: number;
    y: number;
    range: number;
    mpCost: number;
  }[] = [];

  if (!galaxyStore.players) {
    return sources;
  }

  for (const hex of galaxyStore.hexes) {
    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);

    if (MapUtils.isHexImpassable(hex)) {
      continue;
    }

    const mpCost = MapUtils.getHexMPCost(
      hex,
      galaxyStore.currentPlayerId,
      true,
    );

    sources.push({
      id: `mp-${hex._id}`,
      x,
      y,
      range: 0.3,
      mpCost,
    });
  }

  return sources;
});

function getHexCircleConfig(source: { x: number; y: number; range: number }) {
  return {
    x: source.x,
    y: source.y,
    radius: source.range * HEX_WIDTH,
    fill: "#fff",
    stroke: "#000",
    strokeWidth: 4,
    listening: false, // Click through
    dash: [10, 5],
  };
}

function getTextConfig(source: { x: number; y: number; mpCost: number }) {
  return {
    x: source.x - 10, // Approximate centering
    y: source.y - 16,
    text: source.mpCost.toString(),
    fontSize: 32,
    fontFamily: "monospace",
    fontStyle: "bold",
    listening: false,
    align: "center",
    width: 20,
  };
}
</script>
