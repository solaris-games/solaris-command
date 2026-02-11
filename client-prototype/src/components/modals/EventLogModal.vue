<template>
  <BaseModal
    :show="show"
    title="Event Log"
    @close="$emit('close')"
    size="modal-lg"
  >
    <div class="list-group scrollable-list">
      <div
        v-for="event in events"
        :key="event._id"
        class="list-group-item bg-dark bg-opacity-95 text-white border-secondary d-flex justify-content-between align-items-start"
      >
        <div class="flex-grow-1">
          <component :is="getEventComponent(event.type)" :event="event" />
        </div>
        <span class="badge bg-info mb-1 ms-2"
          >Tick: {{ event.tick }}, Cycle: {{ event.cycle }}</span
        >
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, watch, defineAsyncComponent } from "vue";
import { useGameStore } from "@/stores/game";
import { useGalaxyStore } from "@/stores/galaxy";
import { GameEventTypes } from "@solaris-command/core/src/types/game-event";
import BaseModal from "./BaseModal.vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});

defineEmits(["close"]);

const gameStore = useGameStore();
const galaxyStore = useGalaxyStore();

const events = computed(() => gameStore.events);
const gameId = computed(() => galaxyStore.galaxy?.game._id);

const eventComponents = {
  [GameEventTypes.PLAYER_JOINED]: defineAsyncComponent(
    () => import("../events/PlayerJoined.vue"),
  ),
  [GameEventTypes.PLAYER_LEFT]: defineAsyncComponent(
    () => import("../events/PlayerLeft.vue"),
  ),
  [GameEventTypes.PLAYER_AFK]: defineAsyncComponent(
    () => import("../events/PlayerAFK.vue"),
  ),
  [GameEventTypes.PLAYER_CONCEDED]: defineAsyncComponent(
    () => import("../events/PlayerConceded.vue"),
  ),
  [GameEventTypes.GAME_STARTING]: defineAsyncComponent(
    () => import("../events/GameStarting.vue"),
  ),
  [GameEventTypes.GAME_COMPLETED]: defineAsyncComponent(
    () => import("../events/GameCompleted.vue"),
  ),
  [GameEventTypes.COMBAT_REPORT]: defineAsyncComponent(
    () => import("../events/CombatReport.vue"),
  ),
  [GameEventTypes.PLAYER_CYCLE_COMPLETED]: defineAsyncComponent(
    () => import("../events/PlayerCycleCompleted.vue"),
  ),
  [GameEventTypes.GAME_CYCLE_COMPLETED]: defineAsyncComponent(
    () => import("../events/GameCycleCompleted.vue"),
  ),
  [GameEventTypes.PLANET_CAPTURED]: defineAsyncComponent(
    () => import("../events/PlanetCaptured.vue"),
  ),
  [GameEventTypes.UNIT_MOVEMENT_BOUNCED]: defineAsyncComponent(
    () => import("../events/UnitMovementBounced.vue"),
  ),
  [GameEventTypes.UNIT_MOVEMENT_STALLED]: defineAsyncComponent(
    () => import("../events/UnitMovementStalled.vue"),
  ),
  [GameEventTypes.UNIT_DESTROYED_IN_COMBAT]: defineAsyncComponent(
    () => import("../events/UnitDestroyedInCombat.vue"),
  ),
  [GameEventTypes.UNIT_STARVED_BY_OOS]: defineAsyncComponent(
    () => import("../events/UnitStarvedByOOS.vue"),
  ),
  [GameEventTypes.UNIT_COMBAT_ATTACK_CANCELLED]: defineAsyncComponent(
    () => import("../events/UnitCombatAttackCancelled.vue"),
  ),
  [GameEventTypes.UNIT_DEPLOYED]: defineAsyncComponent(
    () => import("../events/UnitDeployed.vue"),
  ),
  [GameEventTypes.PLAYER_DECOMMISSIONED_STATION]: defineAsyncComponent(
    () => import("../events/PlayerDecommissionedStation.vue"),
  ),
  [GameEventTypes.PLAYER_CONSTRUCTED_STATION]: defineAsyncComponent(
    () => import("../events/PlayerConstructedStation.vue"),
  ),
  [GameEventTypes.PLAYERS_TRADED_PRESTIGE]: defineAsyncComponent(
    () => import("../events/PlayersTradedPrestige.vue"),
  ),
  [GameEventTypes.PLAYERS_TRADED_RENOWN]: defineAsyncComponent(
    () => import("../events/PlayersTradedRenown.vue"),
  ),
};

const DefaultEventComponent = defineAsyncComponent(
  () => import("../events/DefaultEvent.vue"),
);

const getEventComponent = (eventType: string) => {
  return (eventComponents as any)[eventType] || DefaultEventComponent;
};

watch(
  () => props.show,
  async (newVal) => {
    if (newVal && gameId.value) {
      await gameStore.fetchEvents(String(gameId.value));
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.scrollable-list {
  max-height: 80vh;
  overflow-y: auto;
  width: 100%;
}
</style>
