<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-traffic-light text-warning"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      A <strong>{{ (event.data as any).catalogId }}</strong
      >'s movement from
      <LocationLink :coords="(event.data as any).fromHexLocation" /> to
      <LocationLink :coords="(event.data as any).toHexLocation" /> has stalled.
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
