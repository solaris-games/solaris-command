<template>
  <v-arrow :config="arrowConfig" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "@/stores/galaxy";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { hexToPixel } from "@/utils/hexUtils";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const props = defineProps<{
  unit: APIUnit;
}>();

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

const arrowConfig = computed(() => {
  const player = galaxyStore.playerLookup?.get(String(props.unit.playerId));
  const playerColor = player ? PLAYER_COLOR_LOOKUP.get(player.color) : null;
  const color = playerColor ? playerColor.background : "#FFFFFF";

  const startHex = galaxyStore.hexLookup?.get(
    String(HexUtils.getCoordsID(props.unit.location))
  );
  const endHex = galaxyStore.hexLookup?.get(
    String(HexUtils.getCoordsID(props.unit.combat.location!))
  );

  if (!startHex || !endHex) {
    return { points: [], visible: false };
  }

  const startPixel = hexToPixel(startHex.location.q, startHex.location.r, HEX_SIZE);
  const endPixel = hexToPixel(endHex.location.q, endHex.location.r, HEX_SIZE);

  // Shorten the arrow
  const dx = endPixel.x - startPixel.x;
  const dy = endPixel.y - startPixel.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitDx = dx / length;
  const unitDy = dy / length;

  const shorterEndPixel = {
    x: endPixel.x - unitDx * (HEX_SIZE / 2 + 15), // Reduced length to be closer to edge
    y: endPixel.y - unitDy * (HEX_SIZE / 2 + 15),
  };

  return {
    points: [startPixel.x, startPixel.y, shorterEndPixel.x, shorterEndPixel.y],
    pointerLength: 10,
    pointerWidth: 10,
    fill: color,
    stroke: color,
    strokeWidth: 8,
  };
});
</script>
