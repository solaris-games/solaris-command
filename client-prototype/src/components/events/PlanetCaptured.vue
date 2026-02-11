<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-globe"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      <span class="text-info">{{ capturedByPlayer?.alias }}</span>
      captured planet {{ planetName }}.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { GameEventsResponseSchema } from '@solaris-command/core/src/types/api/responses';
import { useGalaxyStore } from "@/stores/galaxy";

const props = defineProps<{
  event: GameEventsResponseSchema;
}>();

const galaxyStore = useGalaxyStore();

const capturedByPlayer = computed(() => {
  return galaxyStore.players.find(
    (p) => p._id === (props.event.data as any).capturedByPlayerId,
  );
});

const planetName = computed(() => {
  const planet = galaxyStore.planets.find(
    (p) => p._id === (props.event.data as any).planetId,
  );
  return planet?.name ?? "Unknown";
});
</script>
