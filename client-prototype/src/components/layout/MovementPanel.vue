<template>
  <div v-if="movementStore.isMoveMode && selectedUnit" class="movement-panel">
    <div class="card p-1">
      <div
        class="card-header fw-bold"
        :style="panelStyle"
        style="border-radius: 0"
      >
        <i class="bi bi-person-fill me-1"></i>
        <span>{{ owner?.alias }}</span>
      </div>
      <div class="card-body bg-dark p-2">
        <UnitDetails :unit="selectedUnit" />
        <hr />
        <!-- Movement Path Details -->
        <div v-if="movementStore.startHex && movementStore.movementPath">
          <h6>Movement Path</h6>
          <div v-if="movementStore.movementPath.length">
            <p class="mb-0">
              Segments: {{ movementStore.movementPath.length }}
            </p>
            <p class="mb-0">
              From: ({{ movementStore.startHex.location.q }},
              {{ movementStore.startHex.location.r }})
            </p>
            <p class="mb-2">
              To: ({{
                movementStore.movementPath[
                  movementStore.movementPath.length - 1
                ].location.q
              }},
              {{
                movementStore.movementPath[
                  movementStore.movementPath.length - 1
                ].location.r
              }})
            </p>

          <div class="col-4">
            <button
              class="btn btn-outline-warning"
              @click="movementStore.undoMove()"
            >
              <i class="fas fa-undo"></i> Undo
            </button>
          </div>
          </div>
          <div v-else>
            <p>Select a destination hex to start drawing a path.</p>
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
              <i class="bi bi-x-circle"></i> Cancel
            </button>
          </div>
          <div class="col-6">
            <button
              class="btn btn-success w-100"
              @click="movementStore.confirmMove()"
              :disabled="movementStore.movementPath.length <= 1"
            >
              <i class="bi bi-check-circle"></i> Confirm
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
.movement-panel {
  position: absolute;
  left: 76px;
  top: 16px;
  width: 300px;
  z-index: 10;
  color: #fff;
}
</style>
