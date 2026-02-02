<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-bone text-light"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      A <strong>{{ (event.data as any).catalogId }}</strong> at
      <LocationLink :coords="(event.data as any).location" /> has starved due to
      being out of supply.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameEventsResponseSchema } from "@solaris-command/core/src/types/api";
import LocationLink from "@/components/LocationLink.vue";

defineProps<{
  event: GameEventsResponseSchema;
}>();
</script>
