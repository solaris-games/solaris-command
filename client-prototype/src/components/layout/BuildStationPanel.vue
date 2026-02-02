<template>
  <div
    class="card p-1 mb-1 h-100"
    v-if="galaxyStore.selectedHexIsValidStationSpawnLocation"
  >
    <div class="card-body bg-dark p-2">
      <button
        class="btn btn-sm btn-primary w-100 h-100"
        @click="handleBuildStation"
        data-bs-toggle="tooltip"
        title="Build a new station on this hex"
        :disabled="
          !galaxyStore.currentPlayer ||
          galaxyStore.currentPlayer.prestigePoints <
            CONSTANTS.STATION_PRESTIGE_COST
        "
      >
        <i class="fas fa-satellite"></i> Build Station
        <span class="d-none d-md-inline-block"
          >(<i class="fas fa-coins me-1"></i
          >{{ CONSTANTS.STATION_PRESTIGE_COST }})</span
        >
      </button>
    </div>
    <!-- card-arrow -->
    <div class="card-arrow">
      <div class="card-arrow-top-left"></div>
      <div class="card-arrow-top-right"></div>
      <div class="card-arrow-bottom-left"></div>
      <div class="card-arrow-bottom-right"></div>
    </div>
  </div>

  <div
    class="card p-1"
    v-if="
      selectedHex &&
      selectedStation &&
      String(selectedStation.playerId) === String(galaxyStore.currentPlayerId)
    "
  >
    <div class="card-body bg-dark p-2">
      <button
        class="btn btn-sm btn-outline-danger w-100"
        @click="handleScuttleStation"
        data-bs-toggle="tooltip"
        title="Destroy this station"
      >
        <i class="fas fa-trash"></i> Scuttle Station
      </button>
    </div>
    <!-- card-arrow -->
    <div class="card-arrow">
      <div class="card-arrow-top-left"></div>
      <div class="card-arrow-top-right"></div>
      <div class="card-arrow-bottom-left"></div>
      <div class="card-arrow-bottom-right"></div>
    </div>
  </div>

  <ConfirmationModal
    :show="showBuildStationConfirmation"
    title="Build Station"
    @confirm="confirmBuildStation"
    @cancel="cancelBuildStation"
  >
    <p>
      Are you sure you want to build a
      <strong class="text-info">Station</strong> at this location for
      <span class="text-warning"
        >{{ CONSTANTS.STATION_PRESTIGE_COST }} prestige</span
      >?
    </p>
    <p>
      <i
        >Stations extend the supply range but make sure that you build them
        <span class="text-warning">inside your current supply network</span>
        otherwise they will not have supply to extend.</i
      >
    </p>
  </ConfirmationModal>

  <ConfirmationModal
    :show="showScuttleStationConfirmation"
    title="Scuttle Station"
    @confirm="confirmScuttleStation"
    @cancel="cancelScuttleStation"
  >
    <p>
      Are you sure you want to
      <strong class="text-danger">scuttle this station</strong>? You will not be
      refunded any prestige.
    </p>
  </ConfirmationModal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ConfirmationModal from "../modals/ConfirmationModal.vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { CONSTANTS } from "@solaris-command/core/src/data/constants";

const galaxyStore = useGalaxyStore();
const selectedHex = computed(() => galaxyStore.selectedHex);
const selectedStation = computed(() => galaxyStore.selectedStation);
const showBuildStationConfirmation = ref(false);
const showScuttleStationConfirmation = ref(false);

const handleBuildStation = () => {
  showBuildStationConfirmation.value = true;
};

const confirmBuildStation = () => {
  galaxyStore.buildStation();
  showBuildStationConfirmation.value = false;
};

const cancelBuildStation = () => {
  showBuildStationConfirmation.value = false;
};

const handleScuttleStation = () => {
  showScuttleStationConfirmation.value = true;
};

const confirmScuttleStation = () => {
  galaxyStore.deleteStation();
  showScuttleStationConfirmation.value = false;
};

const cancelScuttleStation = () => {
  showScuttleStationConfirmation.value = false;
};
</script>

<style scoped>
.row p {
  font-size: 0.9rem;
}
</style>
