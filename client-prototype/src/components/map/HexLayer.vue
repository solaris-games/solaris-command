<template>
  <v-group
    v-for="hex in galaxyStore.hexes"
    :key="`hex-${hex.location.q},${hex.location.r}`"
    :config="getHexConfig(hex)"
  >
    <Hexagon v-if="mapSettingsStore.showHexGraphics" :hex="hex" />
    <HexagonAbstract v-if="!mapSettingsStore.showHexGraphics" :hex="hex" />
    <HexagonOverlay :hex="hex" />
  </v-group>
</template>

<script setup lang="ts">
import { useGalaxyStore } from "../../stores/galaxy";
import { hexToPixel } from "../../utils/hexUtils";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import Hexagon from "./Hexagon.vue";
import HexagonAbstract from "./HexagonAbstract.vue";
import HexagonOverlay from "./HexagonOverlay.vue";
import { useMapSettingsStore } from "@/stores/mapSettings";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

function getHexConfig(hex: APIHex) {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  return { x, y };
}
</script>
