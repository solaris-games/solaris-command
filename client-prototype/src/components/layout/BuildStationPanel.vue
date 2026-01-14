<template>
  <div
    class="card p-1"
    v-if="
      selectedHex &&
      selectedHex.playerId === galaxyStore.currentPlayerId &&
      selectedHex.planetId == null &&
      !selectedStation
    "
  >
    <div class="card-body bg-dark">
      <button class="btn btn-sm btn-primary w-100" @click="handleBuildStation">
        <i class="bi bi-gear"></i> Build Station (${{
          CONSTANTS.STATION_PRESTIGE_COST
        }})
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
      Are you sure you want to build a <strong class="text-info">Station</strong> at this location for
      <span class="text-warning">{{ CONSTANTS.STATION_PRESTIGE_COST }} prestige</span>?
    </p>
  </ConfirmationModal>

  <div
    class="card p-1"
    v-if="
      selectedHex &&
      selectedStation &&
      selectedStation.playerId === galaxyStore.currentPlayerId
    "
  >
    <div class="card-body bg-dark">
      <button class="btn btn-sm btn-outline-danger w-100" @click="handleScuttleStation">
        <i class="bi bi-trash"></i> Scuttle Station
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
    :show="showScuttleStationConfirmation"
    title="Scuttle Station"
    @confirm="confirmScuttleStation"
    @cancel="cancelScuttleStation"
  >
    <p>
      Are you sure you want to <strong class="text-danger">scuttle this station</strong>? You will not be refunded
      any prestige.
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
.card {
  color: #fff;
}
.row p {
  font-size: 0.9rem;
}
</style>
