<template>
  <div class="bottom-bar bg-dark text-white p-3">
    <div v-if="!selectedHex">Select a hex on the map to see details.</div>
    <div v-else class="row">
      <div class="col-auto">
        <div class="card">
          <div class="card-body">
            <h4>Hex</h4>
            <p class="mb-0">
              Coords: Q:{{ selectedHex.location.q }} R:{{
                selectedHex.location.r
              }}
            </p>
            <p class="mb-0">Terrain: {{ selectedHex.terrain }}</p>
            <p class="mb-0" v-if="selectedPlanet">
              Planet: {{ selectedPlanet.name }} (Owner:
              {{
                selectedPlanet.playerId === galaxyStore.currentPlayerId
                  ? "You"
                  : selectedPlanet.playerId
                  ? "Enemy"
                  : "Unowned"
              }})
            </p>

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
      </div>

      <div v-if="selectedPlanet" class="col-auto">
        <div class="card">
          <div class="card-body">
            <h4>Planet</h4>
            <p>
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

          <!-- card-arrow -->
          <div class="card-arrow">
            <div class="card-arrow-top-left"></div>
            <div class="card-arrow-top-right"></div>
            <div class="card-arrow-bottom-left"></div>
            <div class="card-arrow-bottom-right"></div>
          </div>
        </div>
      </div>

      <div v-if="selectedStation" class="col-auto">
        <div class="card">
          <div class="card-body">
            <h4>Station</h4>
            <p>
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

          <!-- card-arrow -->
          <div class="card-arrow">
            <div class="card-arrow-top-left"></div>
            <div class="card-arrow-top-right"></div>
            <div class="card-arrow-bottom-left"></div>
            <div class="card-arrow-bottom-right"></div>
          </div>
        </div>
      </div>

      <div v-if="selectedUnit" class="col">
        <div class="card">
          <div class="card-body">
            <div class="d-flex flex-row">
              <div>
                <h4>{{ selectedUnit.catalogId }}</h4>
                <p class="mb-1">MP: {{ selectedUnit.state.mp }} / ???</p>
                <p class="mb-1">
                  Steps: {{ selectedUnit.state.activeSteps }} Active /
                  {{ selectedUnit.state.suppressedSteps }} Suppressed
                </p>
                <p class="mb-1">
                  Supply:
                  <span
                    :class="{
                      'text-success': selectedUnit.supply.isInSupply,
                      'text-danger': !selectedUnit.supply.isInSupply,
                    }"
                    >{{
                      selectedUnit.supply.isInSupply
                        ? "CONNECTED"
                        : `OUT OF SUPPLY (${selectedUnit.supply.ticksLastSupply} since last supply)`
                    }}</span
                  >
                </p>
              </div>

              <!-- Unit Orders -->
              <div class="ms-auto">
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { UNIT_CATALOG } from "@solaris-command/core/src/data/units";

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
</script>

<style scoped>
.bottom-bar {
  height: 200px;
  overflow-y: auto;
}
</style>
