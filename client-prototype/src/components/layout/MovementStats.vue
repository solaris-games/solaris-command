<template>
  <div
    class="unit-stats row no-gutters"
    v-if="movementStore.startHex && movementStore.movementPath"
  >
    <div
      class="col-3 col-md-6 p-0"
      data-bs-toggle="tooltip"
      title="The number of segments in the movement path"
    >
      <span class="stat-label d-none d-md-block"
        ><i class="fas fa-link me-1"></i>Segments</span
      >
      <span class="d-inline-block d-md-none me-1 text-muted"
        ><i class="fas fa-link"></i
      ></span>
      <span class="stat-value">{{ movementStore.movementPath.length }}</span>
    </div>
    <div
      class="col-3 col-md-6 p-0"
      data-bs-toggle="tooltip"
      title="The total movement point cost (excluding ZOC influence)"
    >
      <span class="stat-label d-none d-md-block"
        ><i class="fas fa-gas-pump me-1"></i>MP Cost</span
      >
      <span class="d-inline-block d-md-none me-1 text-muted"
        ><i class="fas fa-gas-pump"></i
      ></span>
      <span class="stat-value">{{ movementStore.movementPathMPCost }}</span>
    </div>
    <div
      class="col-3 col-md-6 p-0"
      data-bs-toggle="tooltip"
      title="The starting hex"
    >
      <span class="stat-label d-none d-md-block"
        ><i class="fas fa-location-pin d me-1"></i>From</span
      >
      <span class="d-inline-block d-md-none me-1 text-muted"
        ><i class="fas fa-location-pin"></i
      ></span>
      <span class="stat-value"
        ><LocationLink
          :coords="movementStore.startHex.location"
          :text-class="'text-white'"
      /></span>
    </div>
    <div
      class="col-3 col-md-6 p-0"
      data-bs-toggle="tooltip"
      title="The destination hex"
    >
      <span class="stat-label d-none d-md-block"
        ><i class="fas fa-location-dot me-1"></i>Destination</span
      >
      <span class="d-inline-block d-md-none me-1 text-muted"
        ><i class="fas fa-location-dot"></i
      ></span>
      <span class="stat-value">
        <LocationLink
          :coords="
            movementStore.movementPath[movementStore.movementPath.length - 1].location
          "
          :text-class="'text-white'"
      /></span>
    </div>
  </div>
  <div v-else>
    <p class="mb-0">Select a destination hex to start drawing a path.</p>
  </div>
</template>

<script setup lang="ts">
import { useMovementStore } from "../../stores/movement";
import LocationLink from "../LocationLink.vue";

const movementStore = useMovementStore();
</script>

<style scoped>
.unit-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}
.stat-label {
  font-size: 0.8rem;
  color: #aaa;
}
.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
}
</style>
