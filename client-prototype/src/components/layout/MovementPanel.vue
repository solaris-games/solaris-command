<template>
  <div v-if="movementStore.isMoveMode && selectedUnit" class="movement-panel">
    <div class="card p-1">
      <div
        class="card-header fw-bold"
        :style="panelStyle"
        style="border-radius: 0"
      >
        <i
          class="fas me-1"
          :class="{
            'fa-user': !owner?.isAIControlled,
            'fa-robot': owner?.isAIControlled,
          }"
        ></i>
        <span>{{ owner?.alias }}</span>
      </div>
      <div class="card-body bg-dark p-2">
        <UnitDetails :unit="selectedUnit" :compact="true" />
        <hr />
        <!-- Movement Path Details -->
        <div v-if="movementStore.startHex && movementStore.movementPath">
          <h6 class="mb-1">Movement Path</h6>
          <div v-if="movementStore.movementPath.length" class="row mb-2">
            <MovementStats />

            <div class="col-12 mt-1">
              <button
                class="btn btn-sm btn-outline-warning"
                @click="movementStore.undoMove()"
              >
                <i class="fas fa-undo"></i> Undo
              </button>
            </div>
          </div>
          <div v-else>
            <p class="mb-0">
              Select a destination hex to start drawing a path.
            </p>
          </div>
        </div>
        <hr />
        <!-- Action Buttons -->
        <div class="row g-2">
          <div class="col-6">
            <button
              class="btn btn-outline-danger w-100"
              @click="movementStore.cancelMove()"
            >
              <i class="fas fa-ban"></i> Cancel
            </button>
          </div>
          <div class="col-6">
            <button
              class="btn btn-success w-100"
              @click="movementStore.confirmMove()"
              :disabled="movementStore.movementPath.length === 0"
            >
              <i class="fas fa-check"></i> Confirm
            </button>
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { useMovementStore } from "../../stores/movement";
import UnitDetails from "./UnitDetails.vue";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import MovementStats from "./MovementStats.vue";

const galaxyStore = useGalaxyStore();
const movementStore = useMovementStore();
const selectedUnit = computed(() => galaxyStore.selectedUnit);

const owner = computed(() => {
  if (!selectedUnit.value || !galaxyStore.playerLookup) return null;
  return galaxyStore.playerLookup.get(String(selectedUnit.value.playerId))!;
});

const panelStyle = computed(() => {
  if (owner.value) {
    const color = PLAYER_COLOR_LOOKUP.get(owner.value.color);
    if (color) {
      return {
        backgroundColor: color.background,
        color: color.foreground,
      };
    }
  }
  return {
    backgroundColor: "#212529",
    color: "#fff",
  };
});
</script>

<style scoped>
hr {
  margin: 0.5rem 0;
}
</style>
