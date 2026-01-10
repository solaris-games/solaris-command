<template>
  <v-group :config="{ x: 16, y: -24 }">
    <v-text :config="{ text: '🪐', fontSize: 32 }" />
  </v-group>
</template>

<script setup lang="ts">
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";

type APIPlanet = GameGalaxyResponseSchema["planets"][0];

const props = defineProps<{
  planet: APIPlanet;
}>();
</script>
