<template>
  <v-layer :config="{ perfectDrawEnabled: false, listening: false }">
    <HexLayer />
    <TerritoryBorderLayer />
    <EffectLayer />
  </v-layer>

  <v-layer :config="{ perfectDrawEnabled: false, listening: false }">
    <UnitLayer />
    <SupplyLayer />
    <ZOCLayer />
    <MovementCostsLayer />
  </v-layer>

  <MovementDrawLayer />
  <CombatDrawLayer />

  <InteractionLayer />
</template>

<script setup lang="ts">
import HexLayer from "./map/HexLayer.vue";
import TerritoryBorderLayer from "./map/TerritoryBorderLayer.vue";
import EffectLayer from "./map/EffectLayer.vue";
import UnitLayer from "./map/UnitLayer.vue";
import SupplyLayer from "./map/SupplyLayer.vue";
import ZOCLayer from "./map/ZOCLayer.vue";
import MovementDrawLayer from "./map/MovementDrawLayer.vue";
import CombatDrawLayer from "./map/CombatDrawLayer.vue";
import InteractionLayer from "./map/InteractionLayer.vue";
import MovementCostsLayer from "./map/MovementCostsLayer.vue";
</script>
