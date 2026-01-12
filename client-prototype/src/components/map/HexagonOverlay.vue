<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref } from "vue";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { useGalaxyStore } from "@/stores/galaxy";
import { useMapSettingsStore } from "@/stores/mapSettings";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const props = defineProps<{
  hex: APIHex;
}>();

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();
const groupRef = ref(null);

const getPolygonConfig = computed(() => {
  let fill = "rgba(0, 0, 0, 0)";
  let stroke = "#444";

  if (props.hex.playerId) {
    const player = galaxyStore.playerLookup!.get(String(props.hex.playerId))!;
    const playerColor = PLAYER_COLOR_LOOKUP.get(player.color);
    if (playerColor) {
      fill = playerColor.background;
      stroke = playerColor.background;
    }
  }

  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    fill,
    stroke: stroke,
    strokeWidth: 4,
    rotation: 60,
    opacity: 0.3,
  };
});

const getCoordTextConfig = computed(() => {
  return {
    text: `${props.hex.location.q},${props.hex.location.r}`,
    fontSize: 12,
    fill: "#FFF",
    y: 40,
    offsetX: 12,
    listening: false,
  };
});

// TODO: Instead of hex player colours we should instead use BORDERS (e.g marching hex)
// to represent territory.

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
    v-if="mapSettingsStore.showPlayerColors"
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <v-regular-polygon :config="getPolygonConfig" />
    <v-text :config="getCoordTextConfig" />
  </v-group>
</template>
