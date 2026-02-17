<template>
  <div class="unit-stats">
    <div
      class="me-1"
      data-bs-toggle="tooltip"
      title="The unit's attack strength"
    >
      <span class="text-warning"
        ><i class="fas fa-bolt-lightning me-1"></i
        >{{ unitCatalog?.stats.attack }}</span
      >
    </div>
    <div
      class="me-1"
      data-bs-toggle="tooltip"
      title="The unit's defensive strength"
    >
      <span
        ><i class="fas fa-shield me-1 text-muted"></i
        >{{ unitCatalog?.stats.defense }}</span
      >
    </div>
    <div class="me-1" data-bs-toggle="tooltip" title="The unit's armour value">
      <span class="text-info"
        ><i class="fas fa-shield-halved me-1"></i
        >{{ unitCatalog?.stats.armour }}</span
      >
    </div>
    <div class="me-0" data-bs-toggle="tooltip" title="Unit's movement points">
      <span class="text-success"
        ><i class="fas fa-arrows-up-down-left-right me-1"></i
        >{{ unit.state.mp }}/{{ unitCatalog?.stats.maxMP }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const props = defineProps<{
  unit: APIUnit;
}>();

const unitCatalog = computed(() => {
  if (!props.unit) return null;
  return UNIT_CATALOG_ID_MAP.get(props.unit.catalogId);
});
</script>

<style scoped>
.unit-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
