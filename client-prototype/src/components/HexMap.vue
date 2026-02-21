<template>
  <v-layer :config="{ perfectDrawEnabled: false, listening: false }">
    <v-group ref="groupRef">
      <HexLayer />
      <TerritoryBorderLayer />
      <EffectLayer />
    </v-group>
  </v-layer>

  <v-layer :config="{ perfectDrawEnabled: false, listening: false }">
    <UnitLayer />
    <SupplyLayer />
    <ZOCLayer />
    <MovementCostsLayer />
    <CoordinatesLayer />
  </v-layer>

  <MovementDrawLayer />
  <CombatDrawLayer />

  <SelectionLayer />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
import HexLayer from "./map/HexLayer.vue";
import TerritoryBorderLayer from "./map/TerritoryBorderLayer.vue";
import EffectLayer from "./map/EffectLayer.vue";
import UnitLayer from "./map/UnitLayer.vue";
import SupplyLayer from "./map/SupplyLayer.vue";
import ZOCLayer from "./map/ZOCLayer.vue";
import MovementDrawLayer from "./map/MovementDrawLayer.vue";
import CombatDrawLayer from "./map/CombatDrawLayer.vue";
import SelectionLayer from "./map/SelectionLayer.vue";
import MovementCostsLayer from "./map/MovementCostsLayer.vue";
import CoordinatesLayer from "./map/CoordinatesLayer.vue";

// -----
// Caching
const groupRef = ref(null);

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
// -----
</script>
