<template>
  <div
    v-if="selectedHex && selectedHex.playerId === galaxyStore.currentPlayerId"
    class="card bg-dark"
  >
    <div class="card-body">
      <div class="input-group">
        <select class="form-select" v-model="selectedUnitToDeploy">
          <option disabled value="">Select Unit</option>
          <option
            v-for="unit in availableUnits"
            :key="unit.id"
            :value="unit.id"
          >
            {{ unit.name }} (${{ unit.cost }})
          </option>
        </select>
        <button
          class="btn btn-success"
          @click="handleDeployUnit"
          :disabled="!selectedUnitToDeploy"
        >
          <i class="bi bi-plus-circle"></i> Deploy
        </button>
      </div>
    </div>
    <div class="card-arrow">
      <div class="card-arrow-top-left"></div>
      <div class="card-arrow-top-right"></div>
      <div class="card-arrow-bottom-left"></div>
      <div class="card-arrow-bottom-right"></div>
    </div>
  </div>
  
  <ConfirmationModal
    v-if="selectedUnitData"
    :show="showDeployUnitConfirmation"
    title="Deploy Unit"
    @confirm="confirmDeployUnit"
    @cancel="cancelDeployUnit"
  >
    <p>
      Are you sure you want to deploy a new
      <strong>{{ selectedUnitData.name }}</strong> for
      {{ selectedUnitData.cost }} prestige?
    </p>
    <p>
      <em>{{ selectedUnitData.description }}</em>
    </p>
    <p>
      <strong>Stats:</strong>
    </p>
    <ul>
      <li>Attack: {{ selectedUnitData.stats.attack }}</li>
      <li>Defense: {{ selectedUnitData.stats.defense }}</li>
      <li>Max MP: {{ selectedUnitData.stats.maxMP }}</li>
    </ul>
  </ConfirmationModal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ConfirmationModal from "../modals/ConfirmationModal.vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { UNIT_CATALOG } from "@solaris-command/core/src/data";

const galaxyStore = useGalaxyStore();
const selectedHex = computed(() => galaxyStore.selectedHex);

const selectedUnitToDeploy = ref("");
const showDeployUnitConfirmation = ref(false);

const availableUnits = computed(() => {
  return UNIT_CATALOG;
});

const selectedUnitData = computed(() => {
  if (!selectedUnitToDeploy.value) return null;
  return UNIT_CATALOG.find((unit) => unit.id === selectedUnitToDeploy.value);
});

const handleDeployUnit = () => {
  if (selectedUnitToDeploy.value) {
    showDeployUnitConfirmation.value = true;
  }
};

const confirmDeployUnit = () => {
  if (selectedUnitToDeploy.value) {
    galaxyStore.deployUnit(selectedUnitToDeploy.value);
    selectedUnitToDeploy.value = "";
  }
  showDeployUnitConfirmation.value = false;
};

const cancelDeployUnit = () => {
  showDeployUnitConfirmation.value = false;
};
</script>

<style scoped>
.card {
  color: #fff;
}
</style>
