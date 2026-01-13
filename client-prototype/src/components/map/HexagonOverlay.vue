<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref } from "vue";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { useGalaxyStore } from "@/stores/galaxy";
import { useMapSettingsStore } from "@/stores/mapSettings";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const props = defineProps<{
  hex: APIHex;
}>();

const mapSettingsStore = useMapSettingsStore();
const groupRef = ref(null);

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
    v-if="mapSettingsStore.showHexCoordinates"
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <v-text :config="getCoordTextConfig" />
  </v-group>
</template>
