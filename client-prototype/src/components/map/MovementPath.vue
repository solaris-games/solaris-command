<template>
  <v-group>
    <v-line :config="lineConfig" />
    <v-arrow :config="arrowConfig" />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "@/stores/galaxy";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { hexToPixel } from "@/utils/hexUtils";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const props = defineProps<{
  unit: APIUnit;
}>();

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

const pathPoints = computed(() => {
  const points: { x: number; y: number }[] = [];
  const startPixel = hexToPixel(
    props.unit.location.q,
    props.unit.location.r,
    HEX_SIZE
  );
  points.push(startPixel);

  props.unit.movement.path.forEach((pathHexCoords) => {
    const hex = galaxyStore.hexLookup?.get(
      String(HexUtils.getCoordsID(pathHexCoords))
    );
    if (hex) {
      const pixel = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
      points.push(pixel);
    }
  });

  return points.map((p) => [p.x, p.y]).flat();
});

const lineConfig = computed(() => {
  return {
    points: pathPoints.value.slice(0, pathPoints.value.length - 4),
    stroke: "white",
    strokeWidth: 12,
    opacity: 0.3,
    dash: [10, 5],
  };
});

const arrowConfig = computed(() => {
  if (pathPoints.value.length < 4) {
    return { points: [], visible: false };
  }

  const lastSegment = pathPoints.value.slice(-4);

  return {
    points: lastSegment,
    pointerLength: 5,
    pointerWidth: 5,
    fill: "white",
    stroke: "white",
    strokeWidth: 12,
    opacity: 0.3,
    dash: [10, 5],
  };
});
</script>
