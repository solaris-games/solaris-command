<template>
  <v-layer :listening="!mapSettingsStore.isPinching">
    <!-- Highlight valid target hexes -->
    <v-regular-polygon
      v-for="(hex, index) in combatStore.validTargetHexes"
      :key="`${hex._id}-${index}`"
      :config="{
        x: hexToPoints(hex)[0],
        y: hexToPoints(hex)[1],
        sides: 6,
        radius: HEX_SIZE - 2,
        strokeWidth: 4,
        rotation: 60,
        listening: false,
        dash: [10, 5],
        opacity: 0.4,
        ...playerColour,
      }"
    />

    <!-- Highlight selected target -->
    <v-regular-polygon
      v-if="targetHex"
      :config="{
        x: hexToPoints(targetHex)[0],
        y: hexToPoints(targetHex)[1],
        sides: 6,
        radius: HEX_SIZE - 2,
        strokeWidth: 6,
        rotation: 60,
        listening: false,
        dash: [10, 5],
        opacity: 0.5,
        ...playerColour,
      }"
    />
  </v-layer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCombatStore } from "../../stores/combat";
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

const HEX_SIZE = 64;

const combatStore = useCombatStore();
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

const targetHex = computed(() => {
  if (!combatStore.targetUnit) return null;
  return galaxyStore.getHex(
    combatStore.targetUnit.location.q,
    combatStore.targetUnit.location.r,
  );
});

const playerColour = computed(() => {
  const player = galaxyStore.playerLookup!.get(
    String(galaxyStore.selectedUnit!.playerId),
  )!;
  const playerColor = PLAYER_COLOR_LOOKUP.get(player.color);
  if (playerColor) {
    return {
      fill: playerColor.background,
      stroke: playerColor.background,
    };
  }

  return {
    fill: "rgba(255, 0, 0, 0.6)",
    stroke: "#ff0000",
  };
});

const hexToPoints = (hex: any) => {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  return [x, y];
};
</script>
