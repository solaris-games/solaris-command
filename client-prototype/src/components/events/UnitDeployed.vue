<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-plus-square"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      <span class="text-info">{{ player?.alias }}</span>
      deployed a new {{ unitName }} unit.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { GameEventsResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { useGalaxyStore } from "@/stores/galaxy";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";

const props = defineProps<{
  event: GameEventsResponseSchema;
}>();

const galaxyStore = useGalaxyStore();

const player = computed(() => {
  return galaxyStore.playerLookup?.get((props.event.data as any).unit.playerId);
});

const unitName = computed(() => {
  const unit = (props.event.data as any).unit;
  if (!unit) return "Unknown";
  return UNIT_CATALOG_ID_MAP.get(unit.catalogId)?.name ?? "Unknown";
});
</script>
