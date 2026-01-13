<template>
  <div v-if="selectedUnit" class="selection-panel">
    <div class="card bg-dark">
      <div class="card-body p-2">
        <div class="unit-header">
          <h4 class="unit-name">{{ unitCatalog?.name }}</h4>
          <p class="unit-type">{{ unitCatalog?.class }}</p>
        </div>
        <div class="unit-steps">
          <div
            v-for="(step, index) in selectedUnit.steps"
            :key="index"
            class="step-square"
            :class="{ suppressed: step.isSuppressed }"
          >
            <span v-if="step.specialistId" class="specialist-symbol">{{
              getSpecialistSymbol(step.specialistId)
            }}</span>
          </div>
        </div>
        <hr />
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
            <span class="stat-value"
              >{{ selectedUnit.state.mp }}/{{ unitCatalog?.stats.maxMP }}</span
            >
          </div>
        </div>
        <hr v-if="specialistStepsWithStats.length > 0" />
        <div
          v-if="specialistStepsWithStats.length > 0"
          class="specialist-stats"
        >
          <div class="d-flex gap-2">
            <div class="card bg-dark text-white flex-grow-1">
              <div class="card-body p-2">
                <div class="stat-column labels">
                  <div class="stat-row" style="font-weight: bold">
                    Specialist Stats
                  </div>
                  <div class="stat-row">Attack</div>
                  <div class="stat-row">Defense</div>
                  <div class="stat-row">Armor</div>
                  <div class="stat-row">Artillery</div>
                  <div class="stat-row">Siege</div>
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
            <div
              v-for="(step, index) in specialistStepsWithStats"
              :key="index"
              class="card bg-dark text-white specialist-stat-card"
            >
              <div class="card-body p-2">
                <div class="stat-column">
                  <div class="stat-row header-row">
                    <div
                      class="step-square-small"
                      :class="{ suppressed: step.isSuppressed }"
                    >
                      <span
                        v-if="step.specialistId"
                        class="specialist-symbol-small"
                        >{{ getSpecialistSymbol(step.specialistId) }}</span
                      >
                    </div>
                  </div>
                  <div class="stat-row">
                    {{ step.specialist?.stats.attack }}
                  </div>
                  <div class="stat-row">
                    {{ step.specialist?.stats.defense }}
                  </div>
                  <div class="stat-row">
                    {{ step.specialist?.stats.armor }}
                  </div>
                  <div class="stat-row">
                    {{ step.specialist?.stats.artillery }}
                  </div>
                  <div class="stat-row">{{ step.specialist?.stats.siege }}</div>
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
        <div v-if="!selectedUnit.supply.isInSupply">
          <hr />
          <div class="supply-status">
            <span v-if="!selectedUnit.supply.isInSupply" class="text-danger">
              Out of Supply ({{
                Math.floor(selectedUnit.supply.ticksLastSupply / 10)
              }}
              cycles)
            </span>
          </div>
        </div>
        <hr />
        <!-- Unit Actions -->
        <div class="unit-actions">
          <div class="row g-2">
            <div class="col-6">
              <button
                v-if="selectedUnit.state.status !== 'MOVING'"
                class="btn btn-secondary w-100"
                @click="galaxyStore.toggleMoveMode()"
                :class="{ 'btn-success': galaxyStore.isMoveMode }"
              >
                <i class="bi bi-arrows-move"></i> Move
              </button>
              <button
                v-else
                class="btn btn-danger w-100"
                @click="galaxyStore.cancelMovement(selectedUnit)"
              >
                <i class="bi bi-x-circle"></i> Cancel Move
              </button>
            </div>
            <div class="col-6">
              <button
                v-if="selectedUnit.state.status !== 'PREPARING'"
                class="btn btn-secondary w-100"
                @click="galaxyStore.toggleAttackMove()"
                :class="{ 'btn-success': galaxyStore.isAttackMode }"
              >
                <i class="bi bi-shield-shaded"></i> Attack
              </button>
              <button
                v-else
                class="btn btn-danger w-100"
                @click="galaxyStore.cancelAttack(selectedUnit)"
              >
                <i class="bi bi-x-circle"></i> Cancel Attack
              </button>
            </div>
            <div class="col-6">
              <button
                class="btn btn-primary w-100"
                @click="galaxyStore.upgradeUnitStep(selectedUnit)"
              >
                <i class="bi bi-arrow-up-circle"></i> Upgrade Step
              </button>
            </div>
            <div class="col-6">
              <button
                class="btn btn-danger w-100"
                @click="galaxyStore.scrapUnitStep(selectedUnit)"
              >
                <i class="bi bi-trash"></i> Scrap Step
              </button>
            </div>
          </div>
          <hr />
          <div class="input-group">
            <select class="form-select" v-model="selectedSpecialist">
              <option disabled value="">Hire Specialist</option>
              <option
                v-for="spec in availableSpecialists"
                :key="spec.id"
                :value="spec.id"
              >
                {{ SPECIALIST_STEP_SYMBOL_MAP.get(spec.type) }} {{ spec.name }} (${{ spec.cost }})
              </option>
            </select>
            <button
              class="btn btn-primary"
              @click="handleHireSpecialist"
              :disabled="!selectedSpecialist"
            >
              <i class="bi bi-person-plus"></i> Hire
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
import {
  UNIT_CATALOG_ID_MAP,
  SPECIALIST_STEP_ID_MAP,
  SPECIALIST_STEP_CATALOG,
  SPECIALIST_STEP_SYMBOL_MAP,
} from "@solaris-command/core/src/data";

const galaxyStore = useGalaxyStore();
const selectedUnit = computed(() => galaxyStore.selectedUnit);

const selectedSpecialist = ref("");
const availableSpecialists = computed(() => {
  return SPECIALIST_STEP_CATALOG;
});

function handleHireSpecialist() {
  if (selectedSpecialist.value && selectedUnit.value) {
    galaxyStore.hireSpecialist(selectedUnit.value, selectedSpecialist.value);
    selectedSpecialist.value = "";
  }
}

const unitCatalog = computed(() => {
  if (!selectedUnit.value) return null;
  return UNIT_CATALOG_ID_MAP.get(selectedUnit.value.catalogId);
});

const getSpecialistSymbol = (specialistId: string) => {
  const specialist = SPECIALIST_STEP_ID_MAP.get(specialistId);
  if (!specialist) return "";
  return SPECIALIST_STEP_SYMBOL_MAP.get(specialist.type);
};

const specialistStepsWithStats = computed(() => {
  if (!selectedUnit.value) return [];
  return selectedUnit.value.steps
    .filter((step) => step.specialistId)
    .map((step) => {
      const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId!);
      return {
        ...step,
        specialist,
      };
    });
});
</script>

<style scoped>
hr {
  margin: 0.5rem 0;
}
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
}
.step-square .specialist-symbol {
  font-size: 1rem;
  color: #000;
}
.step-square.suppressed {
  background-color: transparent;
  border: 1px solid #fff;
}
.step-square.suppressed .specialist-symbol {
  color: #fff;
}
.specialist-stats {
  font-size: 0.9rem;
}
.stat-column {
  display: flex;
  flex-direction: column;
  text-align: right;
  padding: 0 4px;
}
.stat-column.labels {
  flex-grow: 1;
  text-align: left;
}
.stat-row {
  padding: 2px 0;
  height: 24px; /* Ensure consistent height for rows */
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.labels .stat-row {
  justify-content: flex-start;
}
.stat-row.header-row {
  justify-content: flex-end;
  height: 24px;
}
.specialist-stat-card {
  flex-grow: 0; /* Don't grow */
  flex-shrink: 0; /* Don't shrink */
  width: 50px; /* Fixed width for specialist columns */
  text-align: center;
}
.step-square-small {
  width: 20px;
  height: 20px;
  background-color: #fff;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.step-square-small .specialist-symbol-small {
  font-size: 0.8rem;
  color: #000;
}
.step-square-small.suppressed {
  background-color: transparent;
  border: 1px solid #fff;
}
.step-square-small.suppressed .specialist-symbol-small {
  color: #fff;
}
.supply-status {
  text-align: center;
  font-weight: bold;
}
</style>
