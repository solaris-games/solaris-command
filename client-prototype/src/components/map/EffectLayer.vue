<template>
  <!-- Arrows -->
  <MovementPath
    v-for="unit in movingUnits"
    :key="unit._id.toString()"
    :unit="unit"
  />
  <AttackArrow
    v-for="unit in attackingUnits"
    :key="unit._id.toString()"
    :unit="unit"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { UnitStatus } from "@solaris-command/core/src/types/unit";
import AttackArrow from "./AttackArrow.vue";
import MovementPath from "./MovementPath.vue";

const galaxyStore = useGalaxyStore();

const attackingUnits = computed(() =>
  galaxyStore.units.filter((u) => u.state.status === UnitStatus.PREPARING),
);
const movingUnits = computed(() =>
  galaxyStore.units.filter((u) => u.state.status === UnitStatus.MOVING),
);
</script>
