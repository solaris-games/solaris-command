<template>
  <div class="selection-panel">
    <h2>Selection</h2>
    <!-- Supply Toggle -->
    <button class="supply-btn" @click="galaxyStore.toggleSupply()" :class="{ active: galaxyStore.showSupply }">
        Toggle Supply Network
    </button>
    <button class="supply-btn" @click="galaxyStore.toggleZOC()" :class="{ active: galaxyStore.showZOC }">
        Toggle ZOC
    </button>
    <hr />

    <div v-if="!galaxyStore.selected">Nothing selected.</div>
    <div v-else>
      <div v-if="galaxyStore.selected.type === 'HEX'">
        <h3>Hex</h3>
        <p>Coords: {{ galaxyStore.selected.data.location.q }}, {{ galaxyStore.selected.data.location.r }}</p>
        <p>Terrain: {{ galaxyStore.selected.data.terrain }}</p>
        <button @click="galaxyStore.buildStation()">Build Station</button>

        <!-- Deploy Unit UI -->
        <div class="deploy-section">
            <h4>Deploy Unit</h4>
            <select v-model="selectedUnitId">
                <option disabled value="">Select Unit</option>
                <option v-for="unit in availableUnits" :key="unit.id" :value="unit.id">
                    {{ unit.name }} ({{ unit.cost }} P)
                </option>
            </select>
            <button @click="handleDeploy" :disabled="!selectedUnitId">Deploy</button>
        </div>
      </div>

      <div v-if="galaxyStore.selected.type === 'UNIT'">
        <h3>Unit</h3>
        <p>Owner: {{ galaxyStore.selected.data.playerId === galaxyStore.currentPlayerId ? 'You' : 'Enemy' }}</p>

        <div class="actions" v-if="galaxyStore.selected.data.playerId === galaxyStore.currentPlayerId">
           <button @click="galaxyStore.toggleMoveMode()" :class="{ active: galaxyStore.isMoveMode }">Move</button>
           <button @click="galaxyStore.cancelMovement(galaxyStore.selected.data)">Cancel Move</button>
           <br/>
           <button @click="galaxyStore.toggleAttackMove()" :class="{ active: galaxyStore.isAttackMode }">Attack</button>
           <button @click="galaxyStore.cancelAttack(galaxyStore.selected.data)">Cancel Attack</button>
           <br/>
           <button @click="galaxyStore.upgradeUnitStep(galaxyStore.selected.data)">Buy Step</button>
           <button @click="galaxyStore.upgradeUnitStepScout(galaxyStore.selected.data)">Buy Scout Step</button>
           <button @click="galaxyStore.scrapUnitStep(galaxyStore.selected.data)">Scrap Step</button>
        </div>
      </div>

      <div v-if="galaxyStore.selected.type === 'STATION'">
        <h3>Station</h3>
        <p>Owner: {{ galaxyStore.selected.data.playerId === galaxyStore.currentPlayerId ? 'You' : 'Enemy' }}</p>
        <button v-if="galaxyStore.selected.data.playerId === galaxyStore.currentPlayerId" @click="galaxyStore.deleteStation()">Scuttle</button>
      </div>

      <div v-if="galaxyStore.selected.type === 'PLANET'">
        <h3>Planet</h3>
        <p>Owner: {{ galaxyStore.selected.data.playerId === galaxyStore.currentPlayerId ? 'You' : (galaxyStore.selected.data.playerId ? 'Enemy' : 'Unowned') }}</p>
      </div>

        <h3>JSON</h3>
        <pre style="text-align:left;">{{ galaxyStore.selected.data }}</pre>
    </div>

    <div v-if="galaxyStore.isMoveMode" class="mode-indicator">
       MODE: SELECT TARGET HEX TO MOVE
    </div>
    <div v-if="galaxyStore.isAttackMode" class="mode-indicator">
       MODE: SELECT TARGET UNIT TO ATTACK
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGalaxyStore } from '../stores/galaxy';
import { UNIT_CATALOG } from '@solaris-command/core';

const galaxyStore = useGalaxyStore();
const selectedUnitId = ref('');

const availableUnits = computed(() => {
    return UNIT_CATALOG;
});

function handleDeploy() {
    if (selectedUnitId.value) {
        galaxyStore.deployUnit(selectedUnitId.value);
        selectedUnitId.value = '';
    }
}
</script>

<style scoped>
.selection-panel {
  width: 300px;
  background: #222;
  border-left: 1px solid #444;
  padding: 1rem;
  overflow-y: auto;
}
.actions {
  margin-top: 1rem;
  gap: 0.5rem;
}
button {
  padding: 0.5rem 1rem;
  background: #444;
  color: white;
  border: 1px solid #666;
  cursor: pointer;
}
button.active {
  background: #4CAF50;
  border-color: #4CAF50;
}
.mode-indicator {
    margin-top: 1rem;
    padding: 0.5rem;
    background: #FFC107;
    color: black;
    font-weight: bold;
    text-align: center;
}
.deploy-section {
    margin-top: 1rem;
    border-top: 1px solid #444;
    padding-top: 1rem;
}
.deploy-section select {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background: #333;
    color: white;
    border: 1px solid #555;
}
.deploy-section button {
    width: 100%;
    background: #2196F3;
    border-color: #2196F3;
}
.deploy-section button:disabled {
    background: #555;
    border-color: #555;
    cursor: not-allowed;
}
.supply-btn {
    width: 100%;
    margin-bottom: 1rem;
}
</style>
