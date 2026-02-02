<template>
  <div class="right-sidebar">
    <!-- Desktop Layout -->
    <div class="d-none d-md-flex flex-column pe-2">
      <HexDetailsPanel />
      <BuildStationPanel v-if="galaxyStore.isGameInPlay" />
      <DeployUnitPanel v-if="galaxyStore.isGameInPlay" />
      <FleetPanel />
    </div>

    <!-- Mobile Layout -->
    <div class="d-md-none position-absolute start-0 w-100 ps-3 pe-3" style="bottom: 52px">
      <div v-if="mobileFleetOpen" class="w-100">
        <FleetPanel />
      </div>
      <div v-else class="row gx-2">
        <div class="col-12">
          <DeployUnitPanel v-if="galaxyStore.isGameInPlay" />
        </div>
        <div class="col">
          <HexDetailsPanel />
        </div>
        <div class="col-auto d-flex flex-column">
          <BuildStationPanel v-if="galaxyStore.isGameInPlay" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGalaxyStore } from "../../stores/galaxy";
import HexDetailsPanel from "./HexDetailsPanel.vue";
import DeployUnitPanel from "./DeployUnitPanel.vue";
import BuildStationPanel from "./BuildStationPanel.vue";
import FleetPanel from "./FleetPanel.vue";

const galaxyStore = useGalaxyStore();

defineProps<{
  mobileFleetOpen?: boolean;
}>();
</script>

<style scoped>
.right-sidebar {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
</style>
