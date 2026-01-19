<template>
  <v-group>
    <v-arrow
      v-for="(config, index) in arrowConfigs"
      :key="index"
      :config="config"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "@/stores/galaxy";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { hexToPixel } from "@/utils/hexUtils";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { CombatOperation } from "@solaris-command/core/src/types/combat";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const props = defineProps<{
  unit: APIUnit;
}>();

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

const arrowConfigs = computed(() => {
  const startHex = galaxyStore.hexLookup?.get(
    String(HexUtils.getCoordsID(props.unit.location)),
  );
  const endHex = galaxyStore.hexLookup?.get(
    String(HexUtils.getCoordsID(props.unit.combat.location!)),
  );

  if (!startHex || !endHex) {
    return [];
  }

  const startPixel = hexToPixel(
    startHex.location.q,
    startHex.location.r,
    HEX_SIZE,
  );
  const endPixel = hexToPixel(endHex.location.q, endHex.location.r, HEX_SIZE);

  // Vector from start to end
  const dx = endPixel.x - startPixel.x;
  const dy = endPixel.y - startPixel.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitDx = dx / length;
  const unitDy = dy / length;

  // Shorten the arrow to not go into the center of the hex
  const shorterEndPixel = {
    x: endPixel.x - unitDx * (HEX_SIZE / 2 + 15), // Adjusted for slightly shorter arrows
    y: endPixel.y - unitDy * (HEX_SIZE / 2 + 15), // Adjusted for slightly shorter arrows
  };

  // Perpendicular vector for offset
  const pdx = -unitDy;
  const pdy = unitDx;

  const offset = 15; // Increased spacing between arrows

  const baseConfig = {
    pointerLength: 5,
    pointerWidth: 5,
    fill: "#FFF",
    stroke: "#FFF",
    strokeWidth: 6, // Increased thickness
  };

  const centerArrow = {
    // Center arrow
    ...baseConfig,
    points: [startPixel.x, startPixel.y, shorterEndPixel.x, shorterEndPixel.y],
  };

  const leftArrow = {
    // Left arrow
    ...baseConfig,
    points: [
      startPixel.x - pdx * offset,
      startPixel.y - pdy * offset,
      shorterEndPixel.x - pdx * offset,
      shorterEndPixel.y - pdy * offset,
    ],
  };

  const rightArrow = {
    // Right arrow
    ...baseConfig,
    points: [
      startPixel.x + pdx * offset,
      startPixel.y + pdy * offset,
      shorterEndPixel.x + pdx * offset,
      shorterEndPixel.y + pdy * offset,
    ],
  };

  // 1 arrow for feint
  if (props.unit.combat.operation === CombatOperation.FEINT) {
    return [centerArrow];
  } else if (props.unit.combat.operation === CombatOperation.SUPPRESSIVE_FIRE) {
    return [leftArrow, rightArrow];
  }

  return [centerArrow, leftArrow, rightArrow];
});
</script>
