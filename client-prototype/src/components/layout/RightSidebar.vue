<template>
  <div class="right-sidebar">
    <HexDetailsPanel />

    <DeployUnitPanel />

    <div class="card bg-dark mb-3">
        <div class="card-body">
            <div v-if="sortedPlayerUnits.length === 0">
                <p>No units owned.</p>
            </div>
            <div v-else class="units-list">
                <div class="list-group">
                    <a
                    href="#"
                    v-for="unit in sortedPlayerUnits"
                    :key="String(unit._id)"
                    class="list-group-item list-group-item-action bg-secondary text-white border-dark"
                    :class="{
                        'active bg-info':
                        galaxyStore.selectedUnit &&
                        String(galaxyStore.selectedUnit._id) === String(unit._id),
                    }"
                    @click="selectUnit(unit)"
                    >
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">{{ getUnitName(unit.catalogId) }}</h6>
                        <div>
                            <span class="badge" :class="statusBadgeClass(unit.state.status)">{{ unit.state.status }}</span>
                            <span v-if="!unit.supply.isInSupply" class="badge bg-danger ms-1">OOS</span>
                        </div>
                    </div>
                    <div class="d-flex w-100 justify-content-between pt-1">
                        <p class="mb-1 small"><i class="bi bi-grid-3x3"></i> Q:{{ unit.location.q }} R:{{ unit.location.r }}</p>
                        <div class="unit-steps">
                            <div v-for="(step, index) in unit.steps" :key="index" class="step-square" :class="{ 'suppressed': step.isSuppressed }">
                                <span v-if="step.specialistId" class="specialist-initial">{{ getSpecialistInitial(step.specialistId) }}</span>
                            </div>
                        </div>
                    </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../../stores/galaxy";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api";
import { UnitStatus } from "@solaris-command/core/src/types/unit";
import { UNIT_CATALOG_ID_MAP, SPECIALIST_STEP_ID_MAP } from "@solaris-command/core/src/data";
import HexDetailsPanel from "./HexDetailsPanel.vue";
import DeployUnitPanel from "./DeployUnitPanel.vue";

type APIUnit = GameGalaxyResponseSchema["units"][0];

const galaxyStore = useGalaxyStore();

const sortedPlayerUnits = computed(() => {
  const currentPlayerId = galaxyStore.currentPlayerId;
  if (!currentPlayerId || !galaxyStore.units) return [];

  const playerUnits = galaxyStore.units.filter(
    (u) => u.playerId === currentPlayerId
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
    (h) => h.location.q === unit.location.q && h.location.r === unit.location.r
  );
  if (hex) {
    galaxyStore.selectHex(hex);
  }
}

const getUnitName = (catalogId: string) => {
    return UNIT_CATALOG_ID_MAP.get(catalogId)?.name ?? catalogId;
}

const getSpecialistInitial = (specialistId: string) => {
    const specialist = SPECIALIST_STEP_ID_MAP.get(specialistId);
    return specialist ? specialist.type.charAt(0).toUpperCase() : "";
};

const statusBadgeClass = (status: UnitStatus) => {
    switch (status) {
        case UnitStatus.IDLE: return 'bg-warning';
        case UnitStatus.MOVING: return 'bg-info';
        case UnitStatus.PREPARING: return 'bg-danger';
        case UnitStatus.REGROUPING: return 'bg-secondary';
        default: return 'bg-secondary';
    }
}
</script>

<style scoped>
.right-sidebar {
    position: fixed;
    right: 16px;
    top: 76px;
    width: 300px;
    z-index: 10;
    color: #fff;
    max-height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}
.unit-steps {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
}
.step-square {
    width: 16px;
    height: 16px;
    background-color: #fff;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.7rem;
}
.step-square .specialist-initial {
    font-size: 0.8rem;
    color: #000;
}
.step-square.suppressed {
    background-color: transparent;
    border: 1px solid #fff;
}
.step-square.suppressed .specialist-initial {
    color: #fff;
}
</style>

