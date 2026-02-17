<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-crosshairs"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      <p class="mb-0">
        Combat at <LocationLink :coords="(event.data as any).location" />
      </p>
      <div class="small text-muted">
        <div class="d-flex justify-content-between">
          <div>
            <strong>Attacker:</strong>
            <span class="text-success ms-1"
              >{{ attackerPlayer?.alias }} ({{ attackerUnitName }})</span
            >
          </div>
          <div>
            <strong>Defender:</strong>
            <span class="text-danger ms-1"
              >{{ defenderPlayer?.alias }} ({{ defenderUnitName }})</span
            >
          </div>
        </div>
        <div class="text-center mt-1">
          Outcome: <strong>{{ (event.data as any).outcome }}</strong>
        </div>
        <div class="d-flex justify-content-between mt-1">
          <div>
            Attacker Losses: {{ (event.data as any).attacker.losses.losses }} /
            Suppressed: {{ (event.data as any).attacker.losses.suppressed }}
          </div>
          <div>
            Defender Losses: {{ (event.data as any).defender.losses.losses }} /
            Suppressed: {{ (event.data as any).defender.losses.suppressed }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GameEventsResponseSchema } from "@solaris-command/core/src/types/api";
import { useGalaxyStore } from "@/stores/galaxy";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";
import LocationLink from "../LocationLink.vue";

const props = defineProps<{
  event: GameEventsResponseSchema;
}>();

const galaxyStore = useGalaxyStore();

const attackerPlayer = computed(() => {
  return galaxyStore.players.find(
    (p) => p._id === (props.event.data as any).attackerPlayerId,
  );
});

const defenderPlayer = computed(() => {
  return galaxyStore.players.find(
    (p) => p._id === (props.event.data as any).defenderPlayerId,
  );
});

const attackerUnitName = computed(() => {
  return UNIT_CATALOG_ID_MAP.get((props.event.data as any).attackerUnitCatalogId)?.name ?? 'Unknown'
});

const defenderUnitName = computed(() => {
  return UNIT_CATALOG_ID_MAP.get((props.event.data as any).defenderUnitCatalogId)?.name ?? 'Unknown'
});
</script>
