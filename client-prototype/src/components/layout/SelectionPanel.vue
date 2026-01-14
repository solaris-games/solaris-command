<template>
  <div v-if="selectedUnit" class="selection-panel">
    <div class="card p-1">
      <div class="card-header fw-bold" :style="panelStyle" style="border-radius: 0;">
        <i class="bi bi-person-fill me-1"></i>
        <span>{{ owner?.alias }}</span>
      </div>
      <div class="card-body bg-dark p-2">
        <div class="unit-header row">
          <div class="col">
            <h5 class="mb-0">
              {{ unitCatalog?.name }}
            </h5>
          </div>
          <div class="col-auto">
            <span
              class="badge"
              :class="statusBadgeClass(selectedUnit.state.status)"
              >{{ selectedUnit.state.status }}</span
            >
          </div>
        </div>
        <p class="text-muted mb-2">
          {{ unitCatalog?.class.replaceAll("_", " ") }}
        </p>
        <div class="row">
          <div class="col">
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
          </div>
          <div class="col-auto unit-steps">
            <div
              class="step-square step-square-ap"
              v-for="(i, index) in selectedUnit.state.ap"
              :key="index"
            >
              <span class="text-warning"><i class="bi bi-lightning"></i></span>
            </div>
            <div class="step-square step-square-zoc" v-if="unitHasZOCInfluence">
              <span class="text-info"><i class="bi bi-circle"></i></span>
            </div>
            <div class="step-square step-square-initiative">
              <span class="text-success">{{ unitCatalog?.stats.initiative }}</span>
            </div>
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
            <span class="stat-label">Armour</span>
            <span class="stat-value">{{ unitCatalog?.stats.armour }}</span>
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
          <table class="table table-sm table-striped">
            <thead class="table-dark">
              <tr>
                <th scope="col">Bonuses</th>
                <th
                  v-for="(step, index) in specialistStepsWithStats"
                  :key="index"
                >
                  <div class="d-flex justify-content-end">
                    <div
                      class="step-square-small"
                      :class="{ suppressed: step.isSuppressed }"
                    >
                      <span
                        v-if="step.specialistId"
                        class="specialist-symbol-small flex-shrink-0"
                        >{{ getSpecialistSymbol(step.specialistId) }}</span
                      >
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr></tr>
              <tr>
                <th scope="row">Atk.</th>
                <td
                  v-for="(step, index) in specialistStepsWithStats"
                  :key="index"
                  class="text-end"
                >
                  {{ step.specialist?.stats.attack }}
                </td>
              </tr>
              <tr>
                <th scope="row">Def.</th>
                <td
                  v-for="(step, index) in specialistStepsWithStats"
                  :key="index"
                  class="text-end"
                >
                  {{ step.specialist?.stats.defense }}
                </td>
              </tr>
              <tr>
                <th scope="row">Armour</th>
                <td
                  v-for="(step, index) in specialistStepsWithStats"
                  :key="index"
                  class="text-end"
                >
                  {{ step.specialist?.stats.armour }}
                </td>
              </tr>
              <tr>
                <th scope="row">Arty.</th>
                <td
                  v-for="(step, index) in specialistStepsWithStats"
                  :key="index"
                  class="text-end"
                >
                  {{ step.specialist?.stats.artillery }}
                </td>
              </tr>
              <tr>
                <th scope="row">Siege</th>
                <td
                  v-for="(step, index) in specialistStepsWithStats"
                  :key="index"
                  class="text-end"
                >
                  {{ step.specialist?.stats.siege }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!selectedUnit.supply.isInSupply">
          <hr />
          <div class="supply-status">
            <span v-if="!selectedUnit.supply.isInSupply" class="text-danger">
              Out of Supply
              <span v-if="unitOOSCycles > 0">({{ unitOOSCycles }} cycles)</span>
            </span>
          </div>
        </div>
        <hr />
        <!-- Unit Actions -->
        <div class="unit-actions" v-if="canOrderUnit">
          <div class="row g-2">
            <div class="col-6">
              <button
                v-if="selectedUnit.state.status !== 'MOVING'"
                class="btn w-100"
                @click="galaxyStore.toggleMoveMode()"
                :class="{
                  'btn-yellow': galaxyStore.isMoveMode,
                  'btn-success': !galaxyStore.isMoveMode,
                }"
              >
                <i class="bi bi-arrows-move"></i> Move
              </button>
              <button
                v-else
                class="btn btn-outline-success w-100"
                @click="galaxyStore.cancelMovement(selectedUnit)"
              >
                <i class="bi bi-x-circle"></i> Cancel Move
              </button>
            </div>
            <div class="col-6">
              <button
                v-if="selectedUnit.state.status !== 'PREPARING'"
                class="btn w-100"
                @click="galaxyStore.toggleAttackMove()"
                :class="{
                  'btn-yellow': galaxyStore.isAttackMode,
                  'btn-warning': !galaxyStore.isAttackMode,
                }"
              >
                <i class="bi bi-lightning"></i> Attack
              </button>
              <button
                v-else
                class="btn btn-outline-warning w-100"
                @click="galaxyStore.cancelAttack(selectedUnit)"
              >
                <i class="bi bi-x-circle"></i> Cancel Attack
              </button>
            </div>
            <div class="col-6">
              <button
                class="btn btn-primary w-100"
                @click="handleUpgradeUnitStep"
              >
                <i class="bi bi-arrow-up-circle"></i> Upgrade Step
              </button>
            </div>
            <div class="col-6">
              <button
                class="btn btn-outline-danger w-100"
                @click="handleScrapUnitStep"
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
                {{ SPECIALIST_STEP_SYMBOL_MAP.get(spec.type) }}
                {{ spec.name }} (${{ spec.cost }})
              </option>
            </select>
            <button
              class="btn btn-success"
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
    <ConfirmationModal
      :show="showUpgradeConfirmation"
      title="Upgrade Unit"
      @confirm="confirmUpgrade"
      @cancel="cancelUpgrade"
    >
      <p>
        This will add <strong class="text-info">1 suppressed step</strong> to
        the unit at a cost of
        <span class="text-warning"
          >{{ CONSTANTS.UNIT_STEP_BASE_COST }} prestige</span
        >.
      </p>
    </ConfirmationModal>
    <ConfirmationModal
      :show="showScrapConfirmation"
      title="Scrap Unit Step"
      @confirm="confirmScrap"
      @cancel="cancelScrap"
    >
      <p v-if="isLastStep">
        This will <strong class="text-danger">scrap the entire unit</strong> and
        you will be
        <span class="text-warning"
          >refunded
          {{ CONSTANTS.UNIT_STEP_SCRAP_PRESTIGE_REWARD }} prestige</span
        >.
      </p>
      <p v-else>
        This will <strong class="test-danger">scrap the first step</strong> of
        the unit and you will be
        <span class="text-warning"
          >refunded
          {{ CONSTANTS.UNIT_STEP_SCRAP_PRESTIGE_REWARD }} prestige</span
        >.
      </p>
    </ConfirmationModal>
    <ConfirmationModal
      v-if="selectedSpecialistData"
      :show="showHireSpecialistConfirmation"
      title="Hire Specialist"
      @confirm="confirmHireSpecialist"
      @cancel="cancelHireSpecialist"
    >
      <p>
        Are you sure you want to hire
        <strong class="text-info">{{ selectedSpecialistData.name }}</strong> for
        <span class="text-warning"
          >{{ selectedSpecialistData.cost }} prestige</span
        >?
      </p>
      <p>
        <em>{{ selectedSpecialistData.description }}</em>
      </p>
      <p>
        <strong>Bonuses:</strong>
      </p>
      <ul>
        <li>Attack: {{ selectedSpecialistData.stats.attack }}</li>
        <li>Defense: {{ selectedSpecialistData.stats.defense }}</li>
        <li>Armour: {{ selectedSpecialistData.stats.armour }}</li>
        <li>Artillery: {{ selectedSpecialistData.stats.artillery }}</li>
        <li>Siege: {{ selectedSpecialistData.stats.siege }}</li>
      </ul>
    </ConfirmationModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ConfirmationModal from "../modals/ConfirmationModal.vue";
import { useGalaxyStore } from "../../stores/galaxy";
import {
  UNIT_CATALOG_ID_MAP,
  SPECIALIST_STEP_ID_MAP,
  SPECIALIST_STEP_CATALOG,
  SPECIALIST_STEP_SYMBOL_MAP,
  CONSTANTS,
} from "@solaris-command/core/src/data";
import { UnitManager } from "@solaris-command/core/src/utils/unit-manager";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import { UnitStatus } from "@solaris-command/core/src/types/unit";

const galaxyStore = useGalaxyStore();
const selectedUnit = computed(() => galaxyStore.selectedUnit);

const selectedSpecialist = ref("");
const showUpgradeConfirmation = ref(false);
const showScrapConfirmation = ref(false);

const isLastStep = computed(
  () => selectedUnit.value && selectedUnit.value.steps.length === 1
);

const handleUpgradeUnitStep = () => {
  showUpgradeConfirmation.value = true;
};

const confirmUpgrade = () => {
  if (selectedUnit.value) {
    galaxyStore.upgradeUnitStep(selectedUnit.value);
  }
  showUpgradeConfirmation.value = false;
};

const cancelUpgrade = () => {
  showUpgradeConfirmation.value = false;
};

const handleScrapUnitStep = () => {
  showScrapConfirmation.value = true;
};

const confirmScrap = () => {
  if (selectedUnit.value) {
    galaxyStore.scrapUnitStep(selectedUnit.value);
  }
  showScrapConfirmation.value = false;
};

const cancelScrap = () => {
  showScrapConfirmation.value = false;
};

const showHireSpecialistConfirmation = ref(false);

const selectedSpecialistData = computed(() => {
  if (!selectedSpecialist.value) return null;
  return SPECIALIST_STEP_CATALOG.find(
    (spec) => spec.id === selectedSpecialist.value
  );
});

const handleHireSpecialist = () => {
  if (selectedSpecialist.value) {
    showHireSpecialistConfirmation.value = true;
  }
};

const confirmHireSpecialist = () => {
  if (selectedSpecialist.value && selectedUnit.value) {
    galaxyStore.hireSpecialist(selectedUnit.value, selectedSpecialist.value);
    selectedSpecialist.value = "";
  }
  showHireSpecialistConfirmation.value = false;
};

const cancelHireSpecialist = () => {
  showHireSpecialistConfirmation.value = false;
};

const availableSpecialists = computed(() => {
  return SPECIALIST_STEP_CATALOG;
});

const owner = computed(() => {
  if (!selectedUnit.value || !galaxyStore.playerLookup) return null;

  return galaxyStore.playerLookup.get(String(selectedUnit.value.playerId))!;
});

const canOrderUnit = computed(() => {
  return (
    owner &&
    galaxyStore.currentPlayer &&
    String(owner.value?._id) === String(galaxyStore.currentPlayerId) &&
    galaxyStore.isGameInPlay
  );
});

const unitCatalog = computed(() => {
  if (!selectedUnit.value) return null;
  return UNIT_CATALOG_ID_MAP.get(selectedUnit.value.catalogId);
});

const unitOOSCycles = computed(() => {
  if (!selectedUnit.value) return 0;

  return UnitManager.getUnitOOSCycles(
    selectedUnit.value as any,
    galaxyStore.galaxy!.game.settings.ticksPerCycle
  );
});

const unitHasZOCInfluence = computed(() => {
  if (!selectedUnit.value) return false;

  return UnitManager.unitHasZOCInfluence(
    selectedUnit.value as any
  );
})

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

// TODO: Move into a helper
const statusBadgeClass = (status: UnitStatus) => {
  switch (status) {
    case UnitStatus.IDLE:
      return "bg-warning";
    case UnitStatus.MOVING:
      return "bg-info";
    case UnitStatus.PREPARING:
      return "bg-danger";
    case UnitStatus.REGROUPING:
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
};
</script>

<style scoped>
hr {
  margin: 0.5rem 0;
}
.selection-panel {
  position: absolute;
  left: 76px;
  top: 16px;
  width: 300px;
  z-index: 10;
  color: #fff;
}
.unit-header {
  text-align: left;
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
  min-width: 24px;
  min-height: 24px;
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
.step-square-ap {
  border: 1px solid #ff9f0c;
  background-color: transparent;
}
.step-square-zoc {
  border: 1px solid #30beff;
  background-color: transparent;
}
.step-square-initiative {
  border: 1px solid #3cd2a5;
  background-color: transparent;
}
.specialist-stats {
  font-size: 0.9rem;
}
.step-square-small {
  min-width: 20px;
  min-height: 20px;
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
