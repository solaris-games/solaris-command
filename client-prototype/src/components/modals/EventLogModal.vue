<template>
  <div class="event-log-modal">
    <div class="modal-content">
      <div class="card p-1">
        <div class="card-header bg-dark fw-bold">
          Event Log
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
            data-bs-toggle="tooltip"
            title="Close this dialog"
          ></button>
        </div>
        <div class="card-body bg-dark">
          <div class="list-group scrollable-list">
            <div
              v-for="event in events"
              :key="event._id"
              class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-start"
            >
              <div class="flex-grow-1">
                <component :is="getEventComponent(event.type)" :event="event" />
              </div>
              <span class="badge bg-info mb-1 ms-2"
                >Tick: {{ event.tick }}</span
              >
            </div>
          </div>
        </div>
        <!-- card-arrow -->
        <div class="card-arrow">
          <div class="card-arrow-top-left"></div>
          <div class="card-arrow-top-right"></div>
          <div class="card-arrow-bottom-left"></div>
          <div class="card-arrow-bottom-right"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, defineAsyncComponent } from "vue";
import { useGameStore } from "@/stores/game";
import { useGalaxyStore } from "@/stores/galaxy";
import { GameEventTypes } from "@solaris-command/core/src/types/game-event";

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
  [GameEventTypes.PLAYER_CONCEDED]: defineAsyncComponent(
    () => import("../events/PlayerConceded.vue"),
  ),
  [GameEventTypes.GAME_STARTED]: defineAsyncComponent(
    () => import("../events/GameStarted.vue"),
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
  [GameEventTypes.UNIT_DESTROYED_IN_COMBAT]: defineAsyncComponent(
    () => import("../events/UnitDestroyedInCombat.vue"),
  ),
  [GameEventTypes.UNIT_DEPLOYED]: defineAsyncComponent(
    () => import("../events/UnitDeployed.vue"),
  ),
  // Add other event components here
};

const DefaultEventComponent = defineAsyncComponent(
  () => import("../events/DefaultEvent.vue"),
);

const getEventComponent = (eventType: string) => {
  return (eventComponents as any)[eventType] || DefaultEventComponent;
};

onMounted(async () => {
  if (gameId.value) {
    await gameStore.fetchEvents(String(gameId.value));
  }
});
</script>

<style scoped>
.event-log-modal {
  margin-bottom: auto;
}
.btn-close {
  position: absolute;
  top: 8px;
  right: 8px;
}
.scrollable-list {
  max-height: 80vh;
  overflow-y: auto;
  width: 100%;
}
</style>
