<template>
  <v-group :config="{ x: -24, y: -24 }">
    <v-text :config="{ text: '🏗️', fontSize: 26 }" />
  </v-group>
</template>

<script setup lang="ts">
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";

type APIStation = GameGalaxyResponseSchema["stations"][0];

const props = defineProps<{
  station: APIStation;
}>();
</script>
