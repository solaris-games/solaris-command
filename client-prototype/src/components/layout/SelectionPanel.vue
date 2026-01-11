<template>
  <div v-if="selectedHex" class="selection-panel">
    <div class="card mb-3 bg-dark">
      <div class="card-body">
        <h4 class="mb-2">Hex Details</h4>
        <p class="mb-0">
          Coords: Q:{{ selectedHex.location.q }} R:{{
            selectedHex.location.r
          }}
        </p>
        <p class="mb-0">Terrain: {{ selectedHex.terrain }}</p>
        <div v-if="selectedPlanet">
            <hr/>
            <h4 class="mb-2">Planet</h4>
            <p class="mb-0">
                Name: {{ selectedPlanet.name }}
            </p>
            <p class="mb-0">
              Owner:
              {{
                selectedPlanet.playerId === galaxyStore.currentPlayerId
                  ? "You"
                  : selectedPlanet.playerId
                  ? "Enemy"
                  : "Unowned"
              }}
            </p>
        </div>
        <div v-if="selectedStation">
            <hr/>
            <h4 class="mb-2">Station</h4>
            <p class="mb-0">
              Owner:
              {{
                selectedStation.playerId === galaxyStore.currentPlayerId
                  ? "You"
                  : "Enemy"
              }}
            </p>
            <!-- Station Orders -->
            <div
              v-if="selectedStation.playerId === galaxyStore.currentPlayerId"
              class="mt-3"
            >
              <button
                class="btn btn-danger"
                @click="galaxyStore.deleteStation()"
              >
                Scuttle Station
              </button>
            </div>
        </div>
        <hr/>
        <!-- Hex Orders -->
        <div class="d-flex mt-3">
            <select
            class="form-select w-auto me-2"
            v-model="selectedUnitToDeploy"
            >
            <option disabled value="">Deploy Unit</option>
            <option
                v-for="unit in availableUnits"
                :key="unit.id"
                :value="unit.id"
            >
                {{ unit.name }} ({{ unit.cost }} P)
            </option>
            </select>
            <button
            class="btn btn-success me-2"
            @click="handleDeployUnit"
            :disabled="!selectedUnitToDeploy"
            >
            Deploy
            </button>
            <button
            class="btn btn-primary"
            @click="galaxyStore.buildStation()"
            >
            Build Station
            </button>
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

    <div v-if="selectedUnit" class="card bg-dark">
      <div class="card-body">
        <div class="unit-header">
            <h4 class="unit-name">{{ unitCatalog?.name }}</h4>
            <p class="unit-type">{{ unitCatalog?.class }}</p>
        </div>
        <hr/>
        <div class="unit-stats">
            <div>
                <span class="stat-label">Attack</span>
                <span class="stat-value">{{ unitCatalog?.stats.attack }}</span>
            </div>
            <div>
                <span class="stat-label">Defense</span>
                <span class="stat-value">{{ unitCatalog?.stats.defense }}</span>
            </div>
            <div>
                <span class="stat-label">MP</span>
                <span class="stat-value">{{ selectedUnit.state.mp }}/{{ unitCatalog?.stats.maxMP }}</span>
            </div>
        </div>
        <hr/>
        <div class="unit-steps">
            <div v-for="(step, index) in selectedUnit.steps" :key="index" class="step-square" :class="{ 'suppressed': step.isSuppressed }">
                <span v-if="step.specialistId" class="specialist-initial">{{ getSpecialistInitial(step.specialistId) }}</span>
            </div>
        </div>
        <hr/>
        <div class="supply-status">
            <span v-if="!selectedUnit.supply.isInSupply" class="text-danger">
                Out of Supply ({{ Math.floor(selectedUnit.supply.ticksLastSupply / 10) }} cycles)
            </span>
        </div>
        <hr/>
        <!-- Unit Orders -->
        <div class="unit-orders">
            <div class="d-flex mb-2">
                <button
                class="btn btn-secondary me-2"
                @click="galaxyStore.toggleMoveMode()"
                :class="{ 'btn-success': galaxyStore.isMoveMode }"
                >
                Move
                </button>
                <button
                class="btn btn-secondary"
                @click="galaxyStore.cancelMovement(selectedUnit)"
                >
                Cancel Move
                </button>
            </div>
            <div class="d-flex mb-2">
                <button
                class="btn btn-secondary me-2"
                @click="galaxyStore.toggleAttackMove()"
                :class="{ 'btn-success': galaxyStore.isAttackMode }"
                >
                Attack
                </button>
                <button
                class="btn btn-secondary"
                @click="galaxyStore.cancelAttack(selectedUnit)"
                >
                Cancel Attack
                </button>
            </div>
            <div class="d-flex">
                <button
                class="btn btn-primary me-2"
                @click="galaxyStore.upgradeUnitStep(selectedUnit)"
                >
                Buy Step
                </button>
                <button
                class="btn btn-primary me-2"
                @click="galaxyStore.upgradeUnitStepScout(selectedUnit)"
                >
                Buy Scout
                </button>
                <button
                class="btn btn-danger"
                @click="galaxyStore.scrapUnitStep(selectedUnit)"
                >
                Scrap
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
import { computed, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { UNIT_CATALOG, UNIT_CATALOG_ID_MAP, SPECIALIST_STEP_ID_MAP } from "@solaris-command/core/src/data";

const galaxyStore = useGalaxyStore();
const selectedHex = computed(() => galaxyStore.selectedHex);
const selectedPlanet = computed(() => galaxyStore.selectedPlanet);
const selectedStation = computed(() => galaxyStore.selectedStation);
const selectedUnit = computed(() => galaxyStore.selectedUnit);

const selectedUnitToDeploy = ref("");
const availableUnits = computed(() => {
  return UNIT_CATALOG;
});

function handleDeployUnit() {
  if (selectedUnitToDeploy.value) {
    galaxyStore.deployUnit(selectedUnitToDeploy.value);
    selectedUnitToDeploy.value = "";
  }
}

const unitCatalog = computed(() => {
    if (!selectedUnit.value) return null;
    return UNIT_CATALOG_ID_MAP.get(selectedUnit.value.catalogId);
});

const getSpecialistInitial = (specialistId: string) => {
    const specialist = SPECIALIST_STEP_ID_MAP.get(specialistId);
    return specialist ? specialist.type.charAt(0).toUpperCase() : "";
};

</script>

<style scoped>
.selection-panel {
  position: fixed;
  left: 16px;
  top: 76px;
  width: 300px;
  z-index: 10;
  color: #fff;
}
.unit-header {
    text-align: left;
}
.unit-name {
    margin-bottom: 0;
}
.unit-type {
    margin-bottom: 0;
    font-size: 0.9rem;
    color: #aaa;
}
.unit-stats {
    display: flex;
    justify-content: space-around;
    text-align: center;
}
.stat-label {
    display: block;
    font-size: 0.8rem;
    color: #aaa;
}
.stat-value {
    font-size: 1.2rem;
    font-weight: bold;
}
.unit-steps {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
.step-square {
    width: 24px;
    height: 24px;
    background-color: #fff;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #000;
}
.step-square.suppressed {
    background-color: transparent;
    border: 1px solid #fff;
}
.specialist-initial {
    font-size: 1rem;
}
.supply-status {
    text-align: center;
    font-weight: bold;
}
.unit-orders {
    display: flex;
    flex-direction: column;
}
</style>
