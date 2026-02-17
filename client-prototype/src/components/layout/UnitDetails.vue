<template>
  <div class="unit-header row">
    <div class="col">
      <h5 class="mb-0">
        {{ unitCatalog?.name }}
      </h5>
    </div>
    <div class="col-auto">
      <span v-if="!unit.supply.isInSupply" class="badge bg-danger me-1"
        >OOS</span
      >
      <span class="badge" :class="statusBadgeClass(unit.state.status)">{{
        unit.state.status
      }}</span>
    </div>
  </div>
  <div class="row mt-1 mb-1">
    <div class="col me-auto">
      <p class="text-muted mb-0">
        {{ unitCatalog?.class.replaceAll("_", " ") }}
      </p>
    </div>
    <div class="col-auto" v-if="props.compact">
      <UnitStatsCompact :unit="unit" />
    </div>
  </div>
  <div class="row">
    <div class="col">
      <div class="unit-steps">
        <div
          v-for="(step, index) in unit.steps"
          :key="index"
          class="step-square"
          :class="{ suppressed: step.isSuppressed }"
          data-bs-toggle="tooltip"
          :title="
            step.specialistId
              ? `${SPECIALIST_STEP_ID_MAP.get(step.specialistId)?.name}: ${
                  SPECIALIST_STEP_ID_MAP.get(step.specialistId)?.description
                }`
              : ''
          "
        >
          <span v-if="step.specialistId" class="specialist-symbol">{{
            getSpecialistSymbol(step.specialistId)
          }}</span>
        </div>
      </div>
    </div>
    <div class="col-auto unit-steps">
      <div
        v-if="unit.state.ap > 0"
        class="step-square step-square-ap"
        v-for="(i, index) in unit.state.ap"
        :key="index"
        data-bs-toggle="tooltip"
        title="Remaining Action Points"
      >
        <span class="text-warning"><i class="fas fa-bolt-lightning"></i></span>
      </div>
      <div
        class="step-square step-square-zoc"
        v-if="unitHasZOCInfluence"
        data-bs-toggle="tooltip"
        title="Unit exerts a Zone of Control"
      >
        <span class="text-info"><i class="fas fa-circle-dot"></i></span>
      </div>
      <div
        class="step-square step-square-initiative"
        data-bs-toggle="tooltip"
        title="Unit's initiative value"
      >
        <span class="text-success">{{ unitCatalog?.stats.initiative }}</span>
      </div>
    </div>
  </div>
  <hr v-if="!props.compact" />
  <UnitStats v-if="!props.compact" :unit="props.unit" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  SPECIALIST_STEP_ID_MAP,
  SPECIALIST_STEP_SYMBOL_MAP,
} from "@solaris-command/core/src/data/specialists";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";
import { UnitManager } from "@solaris-command/core/src/utils/unit-manager";
import { UnitStatus } from "@solaris-command/core/src/types/unit";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import UnitStats from "./UnitStats.vue";
import UnitStatsCompact from "./UnitStatsCompact.vue";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const props = defineProps<{
  unit: APIUnit;
  compact: boolean;
}>();

const unitCatalog = computed(() => {
  if (!props.unit) return null;
  return UNIT_CATALOG_ID_MAP.get(props.unit.catalogId);
});

const unitHasZOCInfluence = computed(() => {
  if (!props.unit) return false;
  return UnitManager.unitHasZOCInfluence(props.unit as any);
});

const getSpecialistSymbol = (specialistId: string) => {
  const specialist = SPECIALIST_STEP_ID_MAP.get(specialistId);
  if (!specialist) return "";
  return SPECIALIST_STEP_SYMBOL_MAP.get(specialist.type);
};

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
.unit-header {
  text-align: left;
}
.unit-type {
  margin-bottom: 0;
  font-size: 0.9rem;
  color: #aaa;
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
  margin-bottom: auto;
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
.supply-status {
  text-align: center;
  font-weight: bold;
}
</style>
