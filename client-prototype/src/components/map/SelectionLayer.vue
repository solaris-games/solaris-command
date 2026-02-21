<template>
  <v-layer :config="{ perfectDrawEnabled: false, listening: false }">
    <v-group
      v-if="galaxyStore.selectedHex"
      :config="getHexConfig(galaxyStore.selectedHex)"
    >
      <v-regular-polygon :config="getSelectionConfig()" />
    </v-group>
  </v-layer>
</template>

<script setup lang="ts">
import { useGalaxyStore } from "../../stores/galaxy";
import { hexToPixel } from "../../utils/hexUtils";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

function getHexConfig(hex: APIHex) {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  return { x, y };
}

function getSelectionConfig() {
  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    stroke: "rgba(255, 255, 255, 1)",
    strokeWidth: 4,
    rotation: 60,
    listening: false,
  };
}
</script>
