<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-plus-circle"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      <span class="text-info">{{ (event.data as any).playerAlias }}</span>
      constructed a new station at <LocationLink :coords="(event.data as any).location" />.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameEventsResponseSchema } from "@solaris-command/core/src/types/api";
import LocationLink from "../LocationLink.vue";

defineProps<{
  event: GameEventsResponseSchema;
}>();
</script>
