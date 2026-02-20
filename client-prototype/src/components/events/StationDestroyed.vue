<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-satellite"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      <span class="text-info">{{
        (props.event.data as any).destroyedByPlayerAlias
      }}</span>
      destroyed station at
      <LocationLink :coords="(props.event.data as any).location" /> owned by
      <span class="text-info">{{
        (props.event.data as any).ownedByPlayerAlias
      }}</span
      >. They are awarded
      <span class="text-warning"
        ><i class="fas fa-coins me-1"></i
        >{{ (props.event.data as any).destroyStationPrestigeReward }}</span
      >
      prestige.
    </div>
  </div>
</template>

<script setup lang="ts">
import { GameEventsResponseSchema } from "@solaris-command/core/src/types/api/responses";
import LocationLink from "../LocationLink.vue";

const props = defineProps<{
  event: GameEventsResponseSchema;
}>();
</script>
