<template>
  <div v-if="selectedUnit" class="selection-panel">
    <div class="card p-1">
      <div class="card-header fw-bold" :style="panelStyle">
        <i
          class="fas me-1"
          :class="{
            'fa-user': !owner?.isAIControlled,
            'fa-robot': owner?.isAIControlled,
          }"
        ></i>
        <span>{{ owner?.alias }}</span>
        <button
          type="button"
          class="btn-close"
          @click="handleClose"
          data-bs-toggle="tooltip"
          title="Close this dialog"
        ></button>
      </div>
      <div class="card-body bg-dark p-2">
        <UnitDetails :unit="selectedUnit" />
        <UnitSpecialists :unit="selectedUnit" />
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
            <div class="col-12 col-md-6">
              <button
                v-if="selectedUnit.state.status !== UnitStatus.MOVING"
                class="btn w-100 btn-success"
                @click="movementStore.startMove(selectedUnit)"
                data-bs-toggle="tooltip"
                title="Set a move destination for this unit"
                :disabled="
                  selectedUnit.state.mp === 0 ||
                  selectedUnit.state.status !== UnitStatus.IDLE
                "
              >
                <i class="fas fa-arrows-up-down-left-right"></i> Move
              </button>
              <button
                v-else
                class="btn btn-outline-success w-100"
                @click="galaxyStore.cancelMovement(selectedUnit)"
                data-bs-toggle="tooltip"
                title="Cancel the current move order"
              >
                <i class="fas fa-ban"></i> Cancel Move
              </button>
            </div>
            <div class="col-12 col-md-6">
              <button
                v-if="selectedUnit.state.status !== UnitStatus.PREPARING"
                class="btn w-100"
                @click="combatStore.toggleAttackMode()"
                :class="{
                  'btn-yellow': combatStore.isAttackMode,
                  'btn-warning': !combatStore.isAttackMode,
                }"
                data-bs-toggle="tooltip"
                title="Set an attack target for this unit"
                :disabled="
                  selectedUnit.state.ap === 0 ||
                  selectedUnit.state.status !== UnitStatus.IDLE
                "
              >
                <i class="fas fa-bolt-lightning"></i> Attack
              </button>
              <button
                v-else
                class="btn btn-outline-warning w-100"
                @click="galaxyStore.cancelAttack(selectedUnit)"
                data-bs-toggle="tooltip"
                title="Cancel the current attack order"
              >
                <i class="fas fa-ban"></i> Cancel Attack
              </button>
            </div>
            <div class="col-12 col-md-6">
              <button
                class="btn btn-primary w-100"
                @click="handleUpgradeUnitStep"
                data-bs-toggle="tooltip"
                title="Add a new, suppressed step to this unit"
              >
                <i class="fas fa-arrow-up-from-bracket"></i> Upgrade Step
              </button>
            </div>
            <div class="col-12 col-md-6">
              <button
                class="btn btn-outline-danger w-100"
                @click="handleScrapUnitStep"
                data-bs-toggle="tooltip"
                title="Remove a step from this unit"
              >
                <i class="fas fa-trash"></i> Scrap Step
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
                {{ spec.name }} ({{ spec.cost }} P)
              </option>
            </select>
            <button
              class="btn btn-success"
              @click="handleHireSpecialist"
              :disabled="!selectedSpecialist"
              data-bs-toggle="tooltip"
              title="Hire the selected specialist"
            >
              <i class="fas fa-user-astronaut"></i> Hire
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
        This will scrap the <span class="text-danger">entire unit</span> and you
        will be
        <span class="text-warning"
          >refunded
          {{ CONSTANTS.UNIT_STEP_SCRAP_PRESTIGE_REWARD }} prestige</span
        >.
      </p>
      <p v-else>
        This will scrap the
        <span class="text-danger">first step</span>
        of the unit and you will be
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
        <strong>Specialist Step Bonuses:</strong>
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
import { useMovementStore } from "../../stores/movement";
import { useCombatStore } from "../../stores/combat";
import { CONSTANTS } from "@solaris-command/core/src/data/constants";
import {
  SPECIALIST_STEP_CATALOG,
  SPECIALIST_STEP_SYMBOL_MAP,
} from "@solaris-command/core/src/data/specialists";
import { UnitManager } from "@solaris-command/core/src/utils/unit-manager";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import UnitDetails from "./UnitDetails.vue";
import UnitSpecialists from "./UnitSpecialists.vue";
import { UnitStatus } from "@solaris-command/core/src/types/unit";

const galaxyStore = useGalaxyStore();
const movementStore = useMovementStore();
const combatStore = useCombatStore();
const selectedUnit = computed(() => galaxyStore.selectedUnit);

const selectedSpecialist = ref("");
const showUpgradeConfirmation = ref(false);
const showScrapConfirmation = ref(false);

const isLastStep = computed(
  () => selectedUnit.value && selectedUnit.value.steps.length === 1,
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
    (spec) => spec.id === selectedSpecialist.value,
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

const unitOOSCycles = computed(() => {
  if (!selectedUnit.value) return 0;

  return UnitManager.getUnitOOSCycles(
    selectedUnit.value as any,
    galaxyStore.galaxy!.game.settings.ticksPerCycle,
  );
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

const handleClose = () => {
  galaxyStore.selectedUnit = null
}
</script>

<style scoped>
.btn-close {
  position: absolute;
  top: 8px;
  right: 8px;
}
hr {
  margin: 0.5rem 0;
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
