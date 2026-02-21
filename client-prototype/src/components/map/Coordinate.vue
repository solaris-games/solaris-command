<script setup lang="ts">
import { computed } from "vue";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { hexToPixel } from "@/utils/hexUtils";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const HEX_SIZE = 64;

const props = defineProps<{
  hex: APIHex;
}>();

const getCoordTextConfig = computed(() => {
  const { x, y } = hexToPixel(props.hex.location.q, props.hex.location.r, HEX_SIZE);

  return {
    text: `${props.hex.location.q},${props.hex.location.r}`,
    fontSize: 12,
    fill: "#FFF",
    x,
    y: y + 40,
    offsetX: 12,
    listening: false,
  };
});
</script>

<template>
  <v-text :config="getCoordTextConfig" />
</template>
