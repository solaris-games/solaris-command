<template>
  <div class="right-sidebar">
    <HexDetailsPanel />
    <BuildStationPanel v-if="galaxyStore.isGameInPlay" />
    <DeployUnitPanel v-if="galaxyStore.isGameInPlay" />
    <FleetPanel/>
  </div>
</template>

<script setup lang="ts">
import { useGalaxyStore } from "../../stores/galaxy";
import HexDetailsPanel from "./HexDetailsPanel.vue";
import DeployUnitPanel from "./DeployUnitPanel.vue";
import BuildStationPanel from "./BuildStationPanel.vue";
import FleetPanel from "./FleetPanel.vue";

const galaxyStore = useGalaxyStore();
</script>

<style scoped>
.right-sidebar {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 300px;
  z-index: 10;
  color: #fff;
  max-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
</style>
