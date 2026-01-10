<template>
  <v-group>
    <!-- Hex Shape -->
    <v-regular-polygon :config="getPolygonConfig(hex)" />

    <!-- Terrain/Planet Icon -->
    <v-text :config="getTerrainTextConfig(hex)" />

    <!-- Coordinates -->
    <v-text :config="getCoordTextConfig(hex)" />
  </v-group>
</template>

<script setup lang="ts">
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";
import { useGalaxyStore } from "@/stores/galaxy";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const props = defineProps<{
  hex: APIHex;
}>();

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

function getPolygonConfig(hex: APIHex) {
  let fill = "#1a1a1a";
  let stroke = "#444";

  // Basic ownership visualization if any
  if (hex.playerId) {
    const player = galaxyStore.playerLookup!.get(String(hex.playerId))!;
    fill = player.color;
    stroke = player.color;
  } else {
    // Terrain overrides
    switch (hex.terrain) {
      case TerrainTypes.ASTEROID_FIELD:
        fill = "#3a3a3a";
        break;
      case TerrainTypes.DEBRIS_FIELD:
        fill = "#4a2a2a";
        break;
      case TerrainTypes.NEBULA:
        fill = "#2a1a3a";
        break;
      case TerrainTypes.GAS_CLOUD:
        fill = "#1a3a2a";
        break;
      case TerrainTypes.GRAVITY_WELL:
        fill = "#000000";
        stroke = "#fff";
        break;
      case TerrainTypes.RADIATION_STORM:
        fill = "#3a1a00";
        break;
      case TerrainTypes.INDUSTRIAL_ZONE:
        fill = "#3a3a00";
        break;
    }
  }

  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    fill: fill,
    stroke: stroke,
    strokeWidth: 2,
    rotation: 60,
    opacity: 0.5,
  };
}

function getTerrainTextConfig(hex: APIHex) {
  let text = "";
  switch (hex.terrain) {
    case TerrainTypes.ASTEROID_FIELD:
      text = "🪨";
      break;
    case TerrainTypes.DEBRIS_FIELD:
      text = "🗑️";
      break;
    case TerrainTypes.NEBULA:
      text = "🌫️";
      break;
    case TerrainTypes.GAS_CLOUD:
      text = "☁️";
      break;
    case TerrainTypes.GRAVITY_WELL:
      text = "⚫";
      break;
    case TerrainTypes.RADIATION_STORM:
      text = "☢️";
      break;
    case TerrainTypes.INDUSTRIAL_ZONE:
      text = "🏭";
      break;
  }
  return {
    text,
    fontSize: 32,
    offsetX: 16,
    offsetY: 16,
    listening: false,
  };
}

function getCoordTextConfig(hex: APIHex) {
  return {
    text: `${hex.location.q},${hex.location.r}`,
    fontSize: 12,
    fill: "#888",
    y: 40,
    offsetX: 16,
    listening: false,
  };
}
</script>
