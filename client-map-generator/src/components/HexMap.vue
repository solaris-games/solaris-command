<template>
  <div class="hex-map-container" ref="container">
    <v-stage :config="configStage" @wheel="handleWheel" @dragend="handleDragEnd">
      <v-layer ref="layer">
        <!-- Draw Hexes -->
        <v-group
          :config="{
            x: stagePos.x,
            y: stagePos.y,
            scaleX: stageScale,
            scaleY: stageScale,
            draggable: true
          }"
          @dragend="handleGroupDragEnd"
        >
          <v-group
            v-for="hex in mapStore.hexes.values()"
            :key="`${hex.q},${hex.r},${hex.s}`"
            :config="getHexConfig(hex)"
            @click="handleHexClick(hex)"
            @tap="handleHexClick(hex)"
          >
             <!-- Hex Polygon -->
             <v-regular-polygon :config="getPolygonConfig(hex)" />

             <!-- Terrain Icon/Text -->
             <v-text :config="getTerrainTextConfig(hex)" />

             <!-- Planet Icon -->
             <v-text v-if="hex.hasPlanet" :config="getPlanetTextConfig(hex)" />

             <!-- Coordinates (Optional, for debugging) -->
             <v-text :config="getCoordTextConfig(hex)" />
          </v-group>
        </v-group>
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { mapStore, EditorHex } from '../stores/mapStore';
// import { TerrainTypes } from '@solaris-command/core';
import { TerrainTypes } from '@solaris-command/core/src/types/hex';
import { hexToPixel } from '../utils/hexUtils';

const HEX_SIZE = 40;
const container = ref<HTMLDivElement | null>(null);

const configStage = reactive({
  width: window.innerWidth - 300, // Subtract sidebar width
  height: window.innerHeight
});

const stageScale = ref(1);
const stagePos = reactive({ x: (window.innerWidth - 300) / 2, y: window.innerHeight / 2 });

function handleWheel(e: any) {
  // Simple zoom logic
  const scaleBy = 1.1;
  const stage = e.target.getStage();
  const oldScale = stage.scaleX();
  const mousePointTo = {
    x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
    y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
  };

  const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

  stageScale.value = newScale;
  stagePos.x = -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale;
  stagePos.y = -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale;
}

// Just to update reactive state if needed, though v-group config handles it mostly
function handleDragEnd(e: any) {
    // Stage drag if we were dragging stage, but we are dragging group inside layer usually
}
function handleGroupDragEnd(e: any) {
    stagePos.x = e.target.x();
    stagePos.y = e.target.y();
}

function getHexConfig(hex: EditorHex) {
  const { x, y } = hexToPixel(hex.q, hex.r, HEX_SIZE);
  return {
    x, y
  };
}

function getPolygonConfig(hex: EditorHex) {
  let fill = '#1a1a1a';
  let stroke = '#444';

  // Base colors for terrain
  switch (hex.terrain) {
    case TerrainTypes.EMPTY: fill = '#1a1a1a'; break;
    case TerrainTypes.ASTEROID_FIELD: fill = '#3a3a3a'; stroke='#666'; break;
    case TerrainTypes.DEBRIS_FIELD: fill = '#4a2a2a'; break;
    case TerrainTypes.NEBULA: fill = '#2a1a3a'; break;
    case TerrainTypes.GAS_CLOUD: fill = '#1a3a2a'; break;
    case TerrainTypes.GRAVITY_WELL: fill = '#000000'; stroke='#fff'; break;
    case TerrainTypes.RADIATION_STORM: fill = '#3a1a00'; break;
    case TerrainTypes.INDUSTRIAL_ZONE: fill = '#3a3a00'; break;
  }

  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    fill: fill,
    stroke: stroke,
    strokeWidth: 2,
    rotation: 60 // Pointy topped
  };
}

function getTerrainTextConfig(hex: EditorHex) {
  let text = '';
  switch (hex.terrain) {
    case TerrainTypes.ASTEROID_FIELD: text = '🪨'; break;
    case TerrainTypes.DEBRIS_FIELD: text = '🗑️'; break;
    case TerrainTypes.NEBULA: text = '🌫️'; break;
    case TerrainTypes.GAS_CLOUD: text = '☁️'; break;
    case TerrainTypes.GRAVITY_WELL: text = '⚫'; break;
    case TerrainTypes.RADIATION_STORM: text = '☢️'; break;
    case TerrainTypes.INDUSTRIAL_ZONE: text = '🏭'; break;
  }
  return {
    text,
    fontSize: 20,
    offsetX: 10,
    offsetY: 10,
    listening: false // Click through to poly
  };
}

function getPlanetTextConfig(hex: EditorHex) {
   return {
     text: hex.isCapital ? '👑' : '🪐',
     fontSize: 24,
     offsetX: 12,
     offsetY: 12,
     listening: false
   }
}

function getCoordTextConfig(hex: EditorHex) {
    return {
        text: `${hex.q},${hex.r}`,
        fontSize: 10,
        fill: '#666',
        y: 20,
        offsetX: 10,
        listening: false
    }
}

function handleHexClick(hex: EditorHex) {
  const tool = mapStore.selectedTerrain;

  if (tool === 'PLANET') {
    hex.hasPlanet = !hex.hasPlanet; // Toggle
    if (hex.hasPlanet) {
        hex.terrain = TerrainTypes.EMPTY; // Force empty
        hex.isCapital = false;
    } else {
        hex.isCapital = false; // Ensure cleared
    }
  } else if (tool === 'CAPITAL') {
     hex.hasPlanet = !hex.hasPlanet;
     if (hex.hasPlanet) {
         hex.terrain = TerrainTypes.EMPTY;
         hex.isCapital = true;
     } else {
         hex.isCapital = false;
     }
  } else if (tool) {
    // It's a terrain type
    hex.terrain = tool as TerrainTypes;
    hex.hasPlanet = false; // Terrain overwrites planet? Or just can't exist with planet?
    // Requirement: "If a hex is a "planet" hex, then that hex should be marked as "EMPTY" terrain."
    // So if I set terrain to non-EMPTY, I should remove planet.
    if (hex.terrain !== TerrainTypes.EMPTY) {
        hex.hasPlanet = false;
        hex.isCapital = false;
    }
  }
}

// Resize handler
const handleResize = () => {
    configStage.width = window.innerWidth - 300;
    configStage.height = window.innerHeight;
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.hex-map-container {
  flex-grow: 1;
  background: #000;
  overflow: hidden;
}
</style>
