<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-ban text-danger"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      A <strong>{{ (event.data as any).catalogId }}</strong> has cancelled its
      attack order at
      <LocationLink :coords="(event.data as any).combat.location" />.
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
