<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-hourglass-end"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      <p class="mb-0">Cycle complete.</p>
      <ul class="list-unstyled mb-0 small text-muted">
        <li v-for="player in (event.data as any).players" :key="player._id">
          <span class="text-info">{{ player.alias }}</span
          >: {{ player.newVP }} VP
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GameEventsResponseSchema } from '@solaris-command/core/src/types/api/responses';

defineProps<{
  event: GameEventsResponseSchema;
}>();
</script>
