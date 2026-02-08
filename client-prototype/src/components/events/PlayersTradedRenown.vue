<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-handshake"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      <span class="text-info">{{ (event.data as any).fromPlayer.alias }}</span>
      sent <span class="text-success"><i class="fas fa-heart me-1"></i>{{ (event.data as any).renown }} renown</span> to
      <span class="text-info">{{ (event.data as any).toPlayer.alias }}</span
      >.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameEventsResponseSchema } from "@solaris-command/core/src/types/api";

defineProps<{
  event: GameEventsResponseSchema;
}>();
</script>
