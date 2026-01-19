<template>
  <v-layer>
    <!-- Highlight valid target hexes -->
    <v-regular-polygon
      v-for="(hex, index) in combatStore.validTargetHexes"
      :key="`${hex._id}-${index}`"
      :config="{
        x: hexToPoints(hex)[0],
        y: hexToPoints(hex)[1],
        sides: 6,
        radius: HEX_SIZE - 2,
        stroke: '#ff4444',
        strokeWidth: 4,
        fill: 'rgba(255, 0, 0, 0.2)',
        rotation: 60,
        listening: false
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
        stroke: '#ff0000',
        strokeWidth: 6,
        fill: 'rgba(255, 0, 0, 0.4)',
        rotation: 60,
        listening: false
       }"
    />
  </v-layer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCombatStore } from "../../stores/combat";
import { useGalaxyStore } from "../../stores/galaxy";
import { hexToPixel } from "../../utils/hexUtils";

const HEX_SIZE = 64;

const combatStore = useCombatStore();
const galaxyStore = useGalaxyStore();

const targetHex = computed(() => {
    if (!combatStore.targetUnit) return null;
    return galaxyStore.getHex(combatStore.targetUnit.location.q, combatStore.targetUnit.location.r);
});

const hexToPoints = (hex: any) => {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  return [x, y];
};
</script>
