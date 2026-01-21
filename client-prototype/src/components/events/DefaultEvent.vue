<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-info-circle"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      Event: {{ event.type }}
      <pre>{{ event.data }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameEventsResponseSchema } from "@solaris-command/core/src/types/api";

defineProps<{
  event: GameEventsResponseSchema;
}>();
</script>
