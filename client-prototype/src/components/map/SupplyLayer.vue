<template>
  <v-group
    v-if="mapSettingsStore.showSupply"
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <v-group v-for="source in supplySources" :key="source.id">
      <v-circle :config="getSupplyHexCircleConfig(source)" />
      <v-text :config="getSupplyTextConfig(source)" />
    </v-group>
  </v-group>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { SupplyEngine } from "@solaris-command/core/src/utils/supply-engine";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

// Constants for prototype supply viz
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);

const supplySources = computed(() => {
  const sources: {
    id: string;
    x: number;
    y: number;
    range: number;
    remainingMP: number;
    playerId: string;
  }[] = [];

  if (!galaxyStore.players) {
    return sources;
  }

  for (const player of galaxyStore.players) {
    const supplyNetwork = SupplyEngine.calculatePlayerSupplyNetwork(
      player._id,
      galaxyStore.hexes,
      galaxyStore.planets,
      galaxyStore.stations,
    );

    for (const [id, remainingMP] of supplyNetwork) {
      const hex = galaxyStore.hexes.find(
        (h) => HexUtils.getCoordsID(h.location) === id,
      )!;

      const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
      sources.push({
        id: `p-${player._id}-h-${hex._id}`,
        x,
        y,
        range: 0.3,
        remainingMP,
        playerId: String(player._id),
      });
    }
  }

  return sources;
});

function getPlayerColor(playerId: string) {
  const player = galaxyStore.playerLookup?.get(playerId);
  if (!player) return { background: "#FFFFFF", foreground: "#000000" };
  const color = PLAYER_COLOR_LOOKUP.get(player.color);
  return color || { background: "#FFFFFF", foreground: "#000000" };
}

function getSupplyHexCircleConfig(source: {
  x: number;
  y: number;
  range: number;
  playerId: string;
}) {
  const color = getPlayerColor(source.playerId);
  return {
    x: source.x,
    y: source.y,
    radius: source.range * HEX_WIDTH,
    fill: color.background,
    stroke: color.foreground,
    strokeWidth: 4,
    listening: false, // Click through
    dash: [10, 5],
  };
}

function getSupplyTextConfig(source: {
  x: number;
  y: number;
  remainingMP: number;
  playerId: string;
}) {
  const color = getPlayerColor(source.playerId);
  return {
    x: source.x - 10, // Approximate centering
    y: source.y - 16,
    text: source.remainingMP.toString(),
    fontSize: 32,
    fontFamily: "monospace",
    fontStyle: "bold",
    fill: color.foreground,
    listening: false,
    align: "center",
    width: 20,
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
