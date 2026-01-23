<template>
  <div v-if="galaxyStore.selectedHexIsValidSpawnLocation" class="card p-1 mb-1">
    <div class="card-body bg-dark p-2">
      <div class="input-group">
        <select class="form-select" v-model="selectedUnitToDeploy">
          <option disabled value="">Deploy New Unit</option>
          <option
            v-for="unit in availableUnits"
            :key="unit.id"
            :value="unit.id"
          >
            {{ unit.name }} ({{ unit.cost }} P)
          </option>
        </select>
        <button
          class="btn btn-success"
          @click="handleDeployUnit"
          :disabled="!selectedUnitToDeploy"
          data-bs-toggle="tooltip"
          title="Deploy the selected unit"
        >
          <i class="fas fa-rocket"></i> Deploy
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
      <strong class="text-info">{{ selectedUnitData.name }}</strong> at this
      location for
      <span class="text-warning">{{ selectedUnitData.cost }} prestige</span>?
    </p>
    <p>
      <em>{{ selectedUnitData.description }}</em>
    </p>

    <p>
      <strong>Stats:</strong>
    </p>
    <div class="row">
      <div class="col">
        <table class="table table-sm table-striped table-hover">
          <tbody>
            <tr>
              <td>Attack</td>
              <td class="text-end">{{ selectedUnitData.stats.attack }}</td>
            </tr>
            <tr>
              <td>Defense</td>
              <td class="text-end">{{ selectedUnitData.stats.defense }}</td>
            </tr>
            <tr>
              <td>Armour</td>
              <td class="text-end">{{ selectedUnitData.stats.armour }}</td>
            </tr>
            <tr>
              <td>AP</td>
              <td class="text-end">{{ selectedUnitData.stats.maxAP }}</td>
            </tr>
            <tr>
              <td>MP</td>
              <td class="text-end">{{ selectedUnitData.stats.maxMP }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col">
        <table class="table table-sm table-striped table-hover">
          <tbody>
            <tr>
              <td>Steps</td>
              <td class="text-end">
                {{ selectedUnitData.stats.defaultSteps }}
              </td>
            </tr>
            <tr>
              <td>Max Steps</td>
              <td class="text-end">{{ selectedUnitData.stats.maxSteps }}</td>
            </tr>
            <tr>
              <td>Initiative</td>
              <td class="text-end">{{ selectedUnitData.stats.initiative }}</td>
            </tr>
            <tr>
              <td>Emits ZOC</td>
              <td class="text-end">
                {{ selectedUnitData.stats.zoc ? "Yes" : "No" }}
              </td>
            </tr>
            <tr>
              <td>Vision Range</td>
              <td class="text-end">{{ selectedUnitData.stats.los }} Hexes</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </ConfirmationModal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ConfirmationModal from "../modals/ConfirmationModal.vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { UNIT_CATALOG } from "@solaris-command/core/src/data/units";

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
