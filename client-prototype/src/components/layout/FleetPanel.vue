<template>
  <div class="card mb-1 p-1" v-if="sortedPlayerUnits.length">
    <div class="card-header bg-dark fw-bold small">FLEET</div>
    <div class="card-body bg-dark p-2">
      <div class="units-list">
        <div class="list-group">
          <a
            href="#"
            v-for="unit in sortedPlayerUnits"
            :key="String(unit._id)"
            class="list-group-item list-group-item-action bg-dark text-white border-light"
            :class="{
              'active bg-info':
                galaxyStore.selectedUnit &&
                String(galaxyStore.selectedUnit._id) === String(unit._id),
            }"
            @click="selectUnit(unit)"
          >
            <!-- Desktop view-->
            <div class="row d-none d-md-flex">
              <UnitDetails :unit="unit" :compact="true" />
            </div>

            <!-- Mobile View -->
            <div class="row d-md-none">
              <div class="col-4">
                <h6 class="mb-0">{{ getUnitName(unit.catalogId) }}</h6>
              </div>
              <div class="col-3">
                <span
                  v-if="!unit.supply.isInSupply"
                  class="badge bg-danger me-1"
                  >OOS</span
                >
                <span
                  class="badge"
                  :class="statusBadgeClass(unit.state.status)"
                  >{{ unit.state.status }}</span
                >
              </div>
              <div class="col-auto me-auto">
                <p class="small mb-0">
                  <i class="fas fa-table-cells-large"></i>
                  {{ unit.location.q }},
                  {{ unit.location.r }}
                </p>
              </div>
              <div class="unit-steps col-auto">
                <div
                  v-for="(step, index) in unit.steps"
                  :key="index"
                  class="step-square"
                  :class="{ suppressed: step.isSuppressed }"
                  data-bs-toggle="tooltip"
                  :title="getSpecialistTooltip(step)"
                >
                  <span v-if="step.specialistId" class="specialist-symbol">{{
                    getSpecialistSymbol(step.specialistId)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="d-flex w-100 justify-content-between pt-1"></div>
          </a>
        </div>
      </div>
    </div>
    <div class="card-arrow">
      <div class="card-arrow-top-left"></div>
      <div class="card-arrow-top-right"></div>
      <div class="card-arrow-bottom-left"></div>
      <div class="card-arrow-bottom-right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api";
import { UnitStatus } from "@solaris-command/core/src/types/unit";
import {
  SPECIALIST_STEP_ID_MAP,
  SPECIALIST_STEP_SYMBOL_MAP,
} from "@solaris-command/core/src/data/specialists";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";
import UnitDetails from "./UnitDetails.vue";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const galaxyStore = useGalaxyStore();

const sortedPlayerUnits = computed(() => {
  const currentPlayerId = galaxyStore.currentPlayerId;
  if (!currentPlayerId || !galaxyStore.units) return [];

  const playerUnits = galaxyStore.units.filter(
    (u) => u.playerId === currentPlayerId,
  );

  // Sort by out of supply first, then idle, then everything else
  return [...playerUnits].sort((a, b) => {
    // Out of supply comes first
    if (!a.supply.isInSupply && b.supply.isInSupply) return -1;
    if (a.supply.isInSupply && !b.supply.isInSupply) return 1;

    // Then idle units
    if (
      a.state.status === UnitStatus.IDLE &&
      b.state.status !== UnitStatus.IDLE
    )
      return -1;
    if (
      a.state.status !== UnitStatus.IDLE &&
      b.state.status === UnitStatus.IDLE
    )
      return 1;

    // Otherwise, alphabetical by name
    return a.catalogId.localeCompare(b.catalogId);
  });
});

function selectUnit(unit: APIUnit) {
  const hex = galaxyStore.hexes.find(
    (h) => h.location.q === unit.location.q && h.location.r === unit.location.r,
  );
  if (hex) {
    galaxyStore.selectHex(hex);
  }
}

const getUnitName = (catalogId: string) => {
  return UNIT_CATALOG_ID_MAP.get(catalogId)?.name ?? catalogId;
};

const getSpecialistSymbol = (specialistId: string) => {
  const specialist = SPECIALIST_STEP_ID_MAP.get(specialistId);
  if (!specialist) return "";
  return SPECIALIST_STEP_SYMBOL_MAP.get(specialist.type);
};

const getSpecialistTooltip = (step: any) => {
  if (!step.specialistId) {
    return undefined;
  }

  const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId);
  if (!specialist) return "";
  return `${specialist.name}: ${specialist.description}`;
};

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
.unit-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
.step-square {
  width: 18px;
  height: 18px;
  background-color: #fff;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.7rem;
}
.step-square .specialist-symbol {
  font-size: 0.8rem;
  color: #000;
}
.step-square.suppressed {
  background-color: transparent;
  border: 1px solid #fff;
}
.step-square.suppressed .specialist-symbol {
  color: #fff;
}
</style>
