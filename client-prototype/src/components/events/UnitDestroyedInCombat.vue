<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-skull-crossbones"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      Unit {{ unitName }} was destroyed at <LocationLink :coords="(event.data as any).location" />.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { GameEventsResponseSchema } from '@solaris-command/core/src/types/api/responses';
import { useGalaxyStore } from "@/stores/galaxy";
import LocationLink from "../LocationLink.vue";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";

const props = defineProps<{
  event: GameEventsResponseSchema;
}>();

const galaxyStore = useGalaxyStore();

const unitName = computed(() => {
  const unit = galaxyStore.units.find(
    (u) => u._id === (props.event.data as any).unitId,
  );
  if (!unit) return "Unknown";
  return UNIT_CATALOG_ID_MAP.get(unit.catalogId)?.name ?? "Unknown";
});
</script>
