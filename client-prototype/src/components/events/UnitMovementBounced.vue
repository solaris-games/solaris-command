<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-arrow-down"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      Unit {{ unitName }} movement bounced at <LocationLink :coords="(event.data as any).toHexLocation" />.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import LocationLink from "../LocationLink.vue";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";
import { GameEventsResponseSchema } from "@solaris-command/core/src/types/api/responses";

const props = defineProps<{
  event: GameEventsResponseSchema;
}>();

const unitName = computed(() => {
  return UNIT_CATALOG_ID_MAP.get((props.event.data as any).catalogId)?.name ?? "Unknown";
});
</script>
