<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref } from "vue";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { useGalaxyStore } from "@/stores/galaxy";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const props = defineProps<{
  hex: APIHex;
}>();

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const groupRef = ref(null);

const getPolygonConfig = computed(() => {
  let fill = "rgba(0, 0, 0, 0)";
  let stroke = "#444";
  let opacity = 0.6;

  if (props.hex.planetId) {
    stroke = "#FFF";
    opacity = 1;
  }

  if (props.hex.playerId) {
    const player = galaxyStore.playerLookup!.get(String(props.hex.playerId))!;
    const playerColor = PLAYER_COLOR_LOOKUP.get(player.color);
    if (playerColor) {
      fill = playerColor.background;
      stroke = playerColor.foreground;
    }
  }

  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    fill,
    stroke: stroke,
    strokeWidth: 4,
    rotation: 60,
    opacity,
  };
});

const getBackgroundTextConfig = computed(() => {
  let fill = "#FFF";

  if (props.hex.playerId) {
    const player = galaxyStore.playerLookup!.get(String(props.hex.playerId))!;
    const playerColor = PLAYER_COLOR_LOOKUP.get(player.color);
    if (playerColor) {
      fill = playerColor.foreground;
    }
  }

  let text = "";

  switch (props.hex.terrain) {
    case TerrainTypes.ASTEROID_FIELD:
      text = "◌";
      break;
    case TerrainTypes.DEBRIS_FIELD:
      text = "⦼";
      break;
    case TerrainTypes.GAS_CLOUD:
      text = "⩯";
      break;
    case TerrainTypes.GRAVITY_WELL:
      text = "⧨";
      break;
    case TerrainTypes.INDUSTRIAL_ZONE:
      text = "⛋";
      break;
    case TerrainTypes.NEBULA:
      text = "≈";
      break;
    case TerrainTypes.RADIATION_STORM:
      text = "☢";
      break;
  }

  if (props.hex.planetId != null) {
    const isCapital = galaxyStore.planetLookup!.get(String(HexUtils.getCoordsID(props.hex.location)))!.isCapital

    text = isCapital ? "✫" : "⦲";
  }

  const width = Math.sqrt(3) * (HEX_SIZE - 2);
  const height = 2 * (HEX_SIZE - 2);

  return {
    text,
    fontSize: 60,
    fill,
    listening: false,
    x: -width / 2,
    y: -height / 2,
    width,
    height,
    align: "center",
    verticalAlign: "middle",
  };
});

const getForegroundTextConfig = computed(() => {
  let fill = "#FFF";

  if (props.hex.playerId) {
    const player = galaxyStore.playerLookup!.get(String(props.hex.playerId))!;
    const playerColor = PLAYER_COLOR_LOOKUP.get(player.color);
    if (playerColor) {
      fill = playerColor.foreground;
    }
  }

  let text = "";

  if (props.hex.stationId != null) {
    text = "⏣";
  }

  const width = Math.sqrt(3) * (HEX_SIZE - 2);
  const height = 2 * (HEX_SIZE - 2);

  return {
    text,
    fontSize: 40,
    fill,
    listening: false,
    x: -width / 2,
    y: -height / 2,
    width,
    height,
    align: "center",
    verticalAlign: "top", // Aligned to top so it doesn't overlap the background
  };
});

// TODO: Check this caching logic.
onUnmounted(() => {
  // @ts-ignore
  groupRef.value?.getNode().clearCache();
});

onMounted(() => {
  // @ts-ignore
  groupRef.value?.getNode().clearCache();
  // @ts-ignore
  groupRef.value?.getNode().cache();
});

onUpdated(() => {
  // @ts-ignore
  groupRef.value?.getNode().clearCache();
  // @ts-ignore
  groupRef.value?.getNode().cache();
});
</script>

<template>
  <v-group
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <v-regular-polygon :config="getPolygonConfig" />
    <v-text :config="getBackgroundTextConfig" />
    <v-text :config="getForegroundTextConfig" />
  </v-group>
</template>
