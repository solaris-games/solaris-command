<template>
  <HexLayer />
  <EffectLayer />
  <UnitLayer />
  <InteractionLayer />
</template>

<script setup lang="ts">
import HexLayer from "./map/HexLayer.vue";
import UnitLayer from "./map/UnitLayer.vue";
import EffectLayer from "./map/EffectLayer.vue";
import InteractionLayer from "./map/InteractionLayer.vue";
</script>