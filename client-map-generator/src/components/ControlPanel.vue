<template>
  <div class="control-panel">
    <h2>Map Settings</h2>

    <div class="form-group">
      <label>Map Radius: {{ mapStore.radius }}</label>
      <input
        type="range"
        min="1"
        max="20"
        v-model.number="mapStore.radius"
      />
    </div>

    <div class="form-group">
      <label>Player Count: {{ mapStore.playerCount }}</label>
      <input
        type="number"
        min="1"
        max="12"
        v-model.number="mapStore.playerCount"
      />
    </div>

    <div class="form-group">
      <label>Map ID</label>
      <input
        type="text"
        v-model="mapStore.mapId"
      />
    </div>

    <div class="form-group">
      <label>Map Name</label>
      <input
        type="text"
        v-model="mapStore.mapName"
      />
    </div>

    <div class="form-group">
      <label>Victory Points to Win</label>
      <input
        type="number"
        v-model="mapStore.victoryPointsToWin"
      />
    </div>

    <button @click="generate" class="action-btn generate-btn">Generate Map</button>
    <button @click="reset" class="action-btn reset-btn">Reset</button>

    <hr />

    <h3>Tools</h3>
    <div class="form-group">
      <label style="flex-direction: row; align-items: center; gap: 10px;">
        <input type="checkbox" v-model="mapStore.mirrorMode" style="width: auto" />
        Mirror Painting
      </label>
    </div>
    <div class="tools-grid">
      <div class="tool-section">
        <h4>Terrain</h4>
        <button
          v-for="terrain in terrainTypes"
          :key="terrain"
          :class="['tool-btn', { active: mapStore.selectedTerrain === terrain }]"
          @click="selectTool(terrain)"
          :style="{ borderColor: getTerrainColor(terrain) }"
        >
          {{ formatTerrainName(terrain) }}
        </button>
      </div>

      <div class="tool-section">
        <h4>Planets</h4>
        <button
          :class="['tool-btn', { active: mapStore.selectedTerrain === 'PLANET' }]"
          @click="selectTool('PLANET')"
        >
          🪐 Planet
        </button>
        <button
          :class="['tool-btn', { active: mapStore.selectedTerrain === 'CAPITAL' }]"
          @click="selectTool('CAPITAL')"
        >
          👑 Capital
        </button>
      </div>
    </div>

    <hr />

    <button @click="save" class="action-btn save-btn">Save (Console Log)</button>
  </div>
</template>

<script setup lang="ts">
import { mapStore, generateMap } from '../stores/mapStore';
import { TerrainTypes } from '@solaris-command/core/src/types/hex';

// Exclude EMPTY from the palette if we want, or keep it as an eraser.
// "Empty" is effectively the eraser.
const terrainTypes = Object.values(TerrainTypes);

function formatTerrainName(name: string) {
  return name.replace(/_/g, ' ');
}

function getTerrainColor(type: string) {
  // Simple mapping for UI border feedback
  switch (type) {
    case TerrainTypes.EMPTY: return '#333';
    case TerrainTypes.ASTEROID_FIELD: return '#888';
    case TerrainTypes.DEBRIS_FIELD: return '#a65';
    case TerrainTypes.NEBULA: return '#90f';
    case TerrainTypes.GAS_CLOUD: return '#0f9';
    case TerrainTypes.GRAVITY_WELL: return '#000';
    case TerrainTypes.RADIATION_STORM: return '#f50';
    case TerrainTypes.INDUSTRIAL_ZONE: return '#fa0';
    default: return '#ccc';
  }
}

function selectTool(tool: any) {
  mapStore.selectedTerrain = tool;
}

function generate() {
  if (confirm('Generating a new map will clear current work. Continue?')) {
    generateMap();
  }
}

function reset() {
  if (confirm('Reset map?')) {
    generateMap();
  }
}

const emit = defineEmits(['save']);
function save() {
  emit('save');
}
</script>

<style scoped>
.control-panel {
  padding: 20px;
  background: #222;
  color: #eee;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 300px;
  box-sizing: border-box;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input {
  padding: 8px;
  background: #333;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
}

.action-btn {
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
}

.generate-btn { background: #2196F3; color: white; }
.reset-btn { background: #f44336; color: white; }
.save-btn { background: #4CAF50; color: white; margin-top: auto; }

.tools-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tool-btn {
  padding: 8px;
  background: #333;
  border: 2px solid transparent;
  color: #ccc;
  cursor: pointer;
  text-align: left;
  border-radius: 4px;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #444;
}

.tool-btn.active {
  background: #444;
  border-color: #2196F3 !important;
  color: white;
}
</style>
