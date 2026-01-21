<template>
  <div class="d-flex align-items-center">
    <div class="flex-shrink-0">
      <i class="fas fa-crosshairs"></i>
    </div>
    <div class="flex-grow-1 ms-3">
      <p class="mb-0">
        Combat at
        <span
          >{{ (event.data as any).location.q }},
          {{ (event.data as any).location.r }}</span
        >
      </p>
      <div class="small text-muted">
        <div class="d-flex justify-content-between">
          <div>
            <strong>Attacker:</strong>
            <span :style="{ color: attackerPlayer?.color }"
              >{{ attackerPlayer?.alias }} ({{ attackerUnitName }})</span
            >
          </div>
          <div>
            <strong>Defender:</strong>
            <span :style="{ color: defenderPlayer?.color }"
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
  const unit = galaxyStore.units.find(
    (u) => u._id === (props.event.data as any).attackerUnitId,
  );
  if (!unit) return "Unknown";
  return UNIT_CATALOG_ID_MAP.get(unit.catalogId)?.name ?? "Unknown";
});

const defenderUnitName = computed(() => {
  const unit = galaxyStore.units.find(
    (u) => u._id === (props.event.data as any).defenderUnitId,
  );
  if (!unit) return "Unknown";
  return UNIT_CATALOG_ID_MAP.get(unit.catalogId)?.name ?? "Unknown";
});
</script>
