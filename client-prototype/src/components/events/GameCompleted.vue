<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-trophy text-warning"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      The game has ended.
      <span class="text-info">{{
        (event.data as any).winnerPlayer.alias
      }}</span>
      has emerged victorious!
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameEventsResponseSchema } from "@solaris-command/core/src/types/api";

defineProps<{
  event: GameEventsResponseSchema;
}>();
</script>
