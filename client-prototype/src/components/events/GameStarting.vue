<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-play"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      All players have joined, the game will start shortly.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameEventsResponseSchema } from "@solaris-command/core/src/types/api";

defineProps<{
  event: GameEventsResponseSchema;
}>();
</script>
