<template>
  <div class="unit-stats row no-gutters">
    <div
      class="col-3 p-0"
      data-bs-toggle="tooltip"
      title="The unit's attack strength and attack power"
    >
      <span class="stat-label d-none d-md-block"
        ><i class="fas fa-bolt-lightning me-1"></i>Attack</span
      >
      <span class="d-inline-block d-md-none me-1 text-warning"
        ><i class="fas fa-bolt-lightning"></i
      ></span>
      <span class="stat-value"
        >{{ unitCatalog?.stats.attack }}
        <span class="text-success"
          >({{ CombatCalculator.getUnitPower(unit as any, true) }})</span
        ></span
      >
    </div>
    <div
      class="col-3 p-0"
      data-bs-toggle="tooltip"
      title="The unit's defensive strength and defense power"
    >
      <span class="stat-label d-none d-md-block"
        ><i class="fas fa-shield me-1"></i>Defense</span
      >
      <span class="d-inline-block d-md-none me-1 text-muted"
        ><i class="fas fa-shield"></i
      ></span>
      <span class="stat-value"
        >{{ unitCatalog?.stats.defense }}
        <span class="text-danger"
          >({{ CombatCalculator.getUnitPower(unit as any, false) }})</span
        ></span
      >
    </div>
    <div
      class="col-3 p-0"
      data-bs-toggle="tooltip"
      title="The unit's shock value"
    >
      <span class="stat-label d-none d-md-block"
        ><i class="fas fa-bolt-lightning me-1"></i>Shock</span
      >
      <span class="d-inline-block d-md-none me-1 text-info"
        ><i class="fas fa-bolt-lightning"></i
      ></span>
      <span class="stat-value"
        >{{ unitCatalog?.stats.shock }}
        <span
          class="text-warning"
          v-if="
            unitCatalog?.stats.shock !== unitShockShift && unitShockShift > 0
          "
          >({{ unitShockShift }})</span
        ></span
      >
    </div>
    <div
      class="col-3 p-0"
      data-bs-toggle="tooltip"
      title="Remaining Movement Points"
    >
      <span class="stat-label d-none d-md-block"
        ><i class="fas fa-arrows-up-down-left-right me-1"></i>MP</span
      >
      <span class="d-inline-block d-md-none me-1 text-success"
        ><i class="fas fa-arrows-up-down-left-right"></i
      ></span>
      <span class="stat-value"
        >{{ unit.state.mp }}/{{ unitCatalog?.stats.maxMP }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { CombatCalculator } from "@solaris-command/core/src/utils/combat-calculator";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const props = defineProps<{
  unit: APIUnit;
}>();

const unitCatalog = computed(() => {
  if (!props.unit) return null;
  return UNIT_CATALOG_ID_MAP.get(props.unit.catalogId);
});

const unitShockShift = computed(() => {
  return (
    (unitCatalog.value?.stats.shock ?? 0) +
    CombatCalculator.getSpecialistShiftSum(props.unit as any, "shock")
  );
});
</script>

<style scoped>
.unit-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
}
.stat-label {
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
</style>
