<template>
    <div v-if="selectedHex && selectedHex.playerId === galaxyStore.currentPlayerId" class="card bg-dark mb-3">
        <div class="card-body">
            <div class="input-group">
                <select
                class="form-select"
                v-model="selectedUnitToDeploy"
                >
                <option disabled value="">Select Unit</option>
                <option
                    v-for="unit in availableUnits"
                    :key="unit.id"
                    :value="unit.id"
                >
                    {{ unit.name }} (${{ unit.cost }})
                </option>
                </select>
                <button
                class="btn btn-success"
                @click="handleDeployUnit"
                :disabled="!selectedUnitToDeploy"
                >
                <i class="bi bi-plus-circle"></i> Deploy
                </button>
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
import { computed, ref } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import { UNIT_CATALOG } from "@solaris-command/core/src/data";

const galaxyStore = useGalaxyStore();
const selectedHex = computed(() => galaxyStore.selectedHex);

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
.card {
  color: #fff;
}
</style>
