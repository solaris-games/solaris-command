<template>
  <v-layer :config="{ listening: false }">
    <v-group
      v-for="hex in galaxyStore.hexes"
      :key="`hex-${hex.location.q},${hex.location.r}`"
      :config="getHexConfig(hex)"
    >
      <Hexagon :hex="hex" />
    </v-group>
  </v-layer>
</template>

<script setup lang="ts">
import { useGalaxyStore } from "../../stores/galaxy";
import { hexToPixel } from "../../utils/hexUtils";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import Hexagon from "./Hexagon.vue";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

function getHexConfig(hex: APIHex) {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  return { x, y };
}
</script>
