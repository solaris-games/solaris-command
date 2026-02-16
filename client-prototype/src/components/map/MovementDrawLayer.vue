<template>
  <v-layer :listening="!mapSettingsStore.isPinching" :config="{ perfectDrawEnabled: false }">
    <!-- Highlight reachable hexes -->
    <v-regular-polygon
      v-for="(hex, index) in movementStore.reachableHexes"
      :key="`${hex._id}-${index}`"
      :config="{
        x: hexToPoints(hex)[0],
        y: hexToPoints(hex)[1],
        sides: 6,
        radius: HEX_SIZE,
        stroke: 'white',
        strokeWidth: 8,
        rotation: 60,
      }"
    />

    <!-- Draw movement path -->
    <v-line
      v-if="movementStore.startHex && movementStore.movementPath.length"
      :config="{
        points: pathPoints.slice(0, pathPoints.length - 2),
        stroke: 'white',
        strokeWidth: 12,
        lineJoin: 'round',
        lineCap: 'round',
      }"
    />

    <!-- Draw last path arrow -->
    <v-arrow v-if="movementStore.movementPath.length" :config="arrowConfig" />
  </v-layer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMovementStore } from "../../stores/movement";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";

const HEX_SIZE = 64;

const movementStore = useMovementStore();
const mapSettingsStore = useMapSettingsStore();

const pathPoints = computed(() => {
  if (movementStore.startHex == null || movementStore.movementPath.length === 0)
    return [];

  return [movementStore.startHex, ...movementStore.movementPath].flatMap(
    (hex) => hexToPoints(hex),
  );
});

const hexToPoints = (hex: any) => {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);

  return [x, y];
};

const arrowConfig = computed(() => {
  if (pathPoints.value.length < 4) {
    return { points: [], visible: false };
  }

  const lastSegment = pathPoints.value.slice(-4);
  const x1 = lastSegment[0];
  const y1 = lastSegment[1];
  const x2 = lastSegment[2];
  const y2 = lastSegment[3];

  // Shorten the arrow to 70% of the original length to prevent overlaps.
  const factor = 0.7;
  const newX2 = x1 + (x2 - x1) * factor;
  const newY2 = y1 + (y2 - y1) * factor;

  return {
    points: [x1, y1, newX2, newY2],
    pointerLength: 5,
    pointerWidth: 5,
    fill: "white",
    stroke: "white",
    strokeWidth: 12,
    opacity: 1,
    lineCap: "round",
  };
});
</script>
