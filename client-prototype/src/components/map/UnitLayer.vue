<template>
  <UnitCounter
    v-if="mapSettingsStore.showUnits"
    v-for="unit in galaxyStore.units"
    :key="`unit-${unit.location.q},${unit.location.r}`"
    :config="getHexConfig(unit.location)"
    :unit="unit"
  />
</template>

<script setup lang="ts">
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
</script>
