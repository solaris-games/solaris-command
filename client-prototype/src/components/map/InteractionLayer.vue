<template>
  <v-layer>
    <v-group
      v-for="hex in galaxyStore.hexes"
      :key="`interaction-${hex.location.q},${hex.location.r}`"
      :config="getHexConfig(hex)"
      @click="handleClick(hex)"
      @tap="handleClick(hex)"
    >
      <v-regular-polygon :config="getInteractionHexConfig()" />
      <v-regular-polygon
        v-if="isSelected(hex)"
        :config="getSelectionConfig()"
      />
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

function getInteractionHexConfig() {
  return {
    sides: 6,
    radius: HEX_SIZE,
    opacity: 0,
  };
}

function isSelected(hex: APIHex) {
  if (!galaxyStore.selectedHex) return false;
  return galaxyStore.selectedHex._id === hex._id;
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

function handleClick(hex: APIHex) {
  galaxyStore.selectHex(hex);
}
</script>
