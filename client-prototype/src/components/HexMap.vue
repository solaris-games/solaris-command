<template>
  <v-layer>
    <v-group
      v-for="hex in galaxyStore.hexes"
      :key="`${hex.location.q},${hex.location.r}`"
      :config="getHexConfig(hex)"
      @click="handleClick(hex)"
      @tap="handleClick(hex)"
    >
      <!-- Hex Shape -->
      <v-regular-polygon :config="getPolygonConfig(hex)" />

      <!-- Terrain/Planet Icon -->
      <v-text :config="getTerrainTextConfig(hex)" />

      <!-- Coordinates -->
      <v-text :config="getCoordTextConfig(hex)" />

      <!-- Unit Counter -->
      <v-group
        v-if="getUnitAt(hex)"
        :config="getUnitCounterConfig(getUnitAt(hex)!)"
      >
        <!-- background and border -->
        <v-rect :config="getUnitCounterRectConfig(getUnitAt(hex)!)" />
        <!-- catalogId -->
        <v-text :config="getUnitCounterNameConfig(getUnitAt(hex)!)" />
        <!-- steps -->
        <v-group
          v-for="(step, index) in getUnitSteps(getUnitAt(hex)!)"
          :key="index"
          :config="getUnitStepGroupConfig(index)"
        >
          <v-rect :config="getUnitStepRectConfig(step, getUnitAt(hex)!)" />
          <v-text
            v-if="step.specialistId"
            :config="getUnitStepSpecialistConfig(step, getUnitAt(hex)!)"
          />
        </v-group>
        <!-- mp -->
        <v-text :config="getUnitCounterMPConfig(getUnitAt(hex)!)" />
        <!-- ap -->
        <v-text :config="getUnitCounterAPConfig(getUnitAt(hex)!)" />
      </v-group>

      <!-- Station? -->
      <v-group v-if="getStationAt(hex)" :config="{ x: -24, y: -24 }">
        <v-text :config="{ text: '🏗️', fontSize: 26 }" />
      </v-group>

      <!-- Planet? -->
      <v-group v-if="getPlanetAt(hex)" :config="{ x: 16, y: -24 }">
        <v-text :config="{ text: '🪐', fontSize: 32 }" />
      </v-group>

      <!-- Selection Highlight -->
      <v-regular-polygon
        v-if="isSelected(hex)"
        :config="getSelectionConfig()"
      />
    </v-group>

    <!-- Supply Network Overlay -->
    <v-group v-if="galaxyStore.showSupply">
      <v-circle
        v-for="source in supplySources"
        :key="source.id"
        :config="getSupplyHexCircleConfig(source)"
      />
    </v-group>

    <!-- ZOC Overlay -->
    <v-group v-if="galaxyStore.showZOC">
      <v-circle
        v-for="source in zocSources"
        :key="source.id"
        :config="getZOCHexCircleConfig(source)"
      />
    </v-group>
  </v-layer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../stores/galaxy";
import { hexToPixel } from "../utils/hexUtils";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { SupplyEngine } from "@solaris-command/core/src/utils/supply-engine";
import {
  UNIT_CATALOG_ID_MAP,
  SPECIALIST_STEP_ID_MAP,
} from "@solaris-command/core/src/data";

type APIHex = GameGalaxyResponseSchema["hexes"][0];
type APIUnit = GameGalaxyResponseSchema["units"][0];
type APIStep = APIUnit["steps"][0];

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

const COUNTER_WIDTH = 72;
const COUNTER_HEIGHT = 72;

function getUnitAt(hex: APIHex) {
  return galaxyStore.units.find(
    (u) => u.location.q === hex.location.q && u.location.r === hex.location.r
  );
}

function getPlayerColor(unit: APIUnit) {
  const player = galaxyStore.playerLookup?.get(String(unit.playerId));
  return player?.color || "#FFFFFF";
}

function getUnitCounterConfig(unit: APIUnit) {
  return {
    x: -COUNTER_WIDTH / 2,
    y: -COUNTER_HEIGHT / 2,
  };
}

function getUnitCounterRectConfig(unit: APIUnit) {
  return {
    width: COUNTER_WIDTH,
    height: COUNTER_HEIGHT,
    fill: "#1a202c",
    stroke: getPlayerColor(unit),
    strokeWidth: 3,
    cornerRadius: 8,
  };
}

function getUnitCounterNameConfig(unit: APIUnit) {
  const unitCatalog = UNIT_CATALOG_ID_MAP.get(unit.catalogId);
  return {
    text: unitCatalog?.name.toUpperCase() || unit.catalogId.toUpperCase(),
    fontSize: 9,
    fontFamily: "Roboto, sans-serif",
    fill: getPlayerColor(unit),
    width: COUNTER_WIDTH - 12,
    y: 4,
    align: "center",
    fontStyle: "bold",
  };
}

function getUnitSteps(unit: APIUnit) {
  const unitCatalog = UNIT_CATALOG_ID_MAP.get(unit.catalogId);
  if (!unitCatalog) return [];
  const existingSteps = unit.steps;
  const maxSteps = unitCatalog.stats.maxSteps;
  const destroyedStepCount = maxSteps - existingSteps.length;
  const destroyedSteps = Array.from({ length: destroyedStepCount }, () => ({
    isSuppressed: true,
    specialistId: null,
  }));

  return [...existingSteps, ...destroyedSteps];
}

function getUnitStepGroupConfig(index: number) {
  const STEP_SIZE = 12;
  const STEP_GAP = 4;
  const stepsPerRow = 4;
  const row = Math.floor(index / stepsPerRow);
  const col = index % stepsPerRow;
  const totalWidth = stepsPerRow * STEP_SIZE + (stepsPerRow - 1) * STEP_GAP;
  const x = col * (STEP_SIZE + STEP_GAP) + (COUNTER_WIDTH - totalWidth) / 2;
  const y = row * (STEP_SIZE + STEP_GAP) + 30;
  return { x, y };
}

function getUnitStepRectConfig(step: APIStep, unit: APIUnit) {
  return {
    width: 12,
    height: 12,
    fill: step.isSuppressed ? "transparent" : getPlayerColor(unit),
    stroke: getPlayerColor(unit),
    strokeWidth: 2,
    cornerRadius: 4,
  };
}

function getUnitStepSpecialistConfig(step: APIStep, unit: APIUnit) {
  const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId!);
  const initial = specialist ? specialist.type.charAt(0) : "";
  return {
    text: initial,
    fontSize: 7,
    fontFamily: "Roboto, sans-serif",
    fill: "#1a202c",
    width: 12,
    height: 12,
    align: "center",
    verticalAlign: "middle",
    fontStyle: "bold",
  };
}

function getUnitCounterMPConfig(unit: APIUnit) {
  const unitCatalog = UNIT_CATALOG_ID_MAP.get(unit.catalogId);
  return {
    text: `${unit.state.mp}/${unitCatalog?.stats.maxMP}`,
    fontSize: 10,
    fontFamily: "Roboto, sans-serif",
    fill: getPlayerColor(unit),
    x: 5,
    y: COUNTER_HEIGHT - 15,
    fontStyle: "bold",
  };
}

function getUnitCounterAPConfig(unit: APIUnit) {
  return {
    text: "⚡".repeat(unit.state.ap),
    fontSize: 10,
    fontFamily: "Roboto, sans-serif",
    fill: getPlayerColor(unit),
    x: COUNTER_WIDTH - 20,
    y: COUNTER_HEIGHT - 15,
    fontStyle: "bold",
  };
}

// Constants for prototype supply viz
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);

const supplySources = computed(() => {
  const sources: {
    id: string;
    x: number;
    y: number;
    range: number;
  }[] = [];

  if (galaxyStore.currentPlayerId == null) {
    return sources;
  }

  const supplyNetwork = SupplyEngine.calculatePlayerSupplyNetwork(
    galaxyStore.currentPlayerId,
    galaxyStore.hexes,
    galaxyStore.planets,
    galaxyStore.stations
  );

  for (const id of supplyNetwork) {
    const hex = galaxyStore.hexes.find(
      (h) => HexUtils.getCoordsID(h.location) === id
    )!;

    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
    sources.push({ id: `h-${hex._id}`, x, y, range: 0.2 });
  }

  return sources;
});

const zocSources = computed(() => {
  const sources: {
    id: string;
    x: number;
    y: number;
    range: number;
  }[] = [];

  if (galaxyStore.currentPlayerId == null) {
    return sources;
  }

  for (const hex of galaxyStore.hexes) {
    if (hex.zoc.length) {
      const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
      sources.push({ id: `h-${hex._id}`, x, y, range: 0.2 });
    }
  }

  return sources;
});

function getSupplyHexCircleConfig(source: {
  x: number;
  y: number;
  range: number;
}) {
  return {
    x: source.x,
    y: source.y,
    radius: source.range * HEX_WIDTH,
    fill: "rgba(255, 255, 255, 1)",
    strokeWidth: 2,
    listening: false, // Click through
  };
}

function getZOCHexCircleConfig(source: {
  x: number;
  y: number;
  range: number;
}) {
  return {
    x: source.x,
    y: source.y,
    radius: source.range * HEX_WIDTH,
    fill: "rgba(255, 255, 255, 1)",
    strokeWidth: 2,
    listening: false, // Click through
  };
}

function getHexConfig(hex: APIHex) {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  return { x, y };
}

function getPolygonConfig(hex: APIHex) {
  let fill = "#1a1a1a";
  let stroke = "#444";

  // Basic ownership visualization if any
  if (hex.playerId) {
    const player = galaxyStore.playerLookup!.get(String(hex.playerId))!;
    fill = player.color;
    stroke = player.color;
  } else {
    // Terrain overrides
    switch (hex.terrain) {
      case TerrainTypes.ASTEROID_FIELD:
        fill = "#3a3a3a";
        break;
      case TerrainTypes.DEBRIS_FIELD:
        fill = "#4a2a2a";
        break;
      case TerrainTypes.NEBULA:
        fill = "#2a1a3a";
        break;
      case TerrainTypes.GAS_CLOUD:
        fill = "#1a3a2a";
        break;
      case TerrainTypes.GRAVITY_WELL:
        fill = "#000000";
        stroke = "#fff";
        break;
      case TerrainTypes.RADIATION_STORM:
        fill = "#3a1a00";
        break;
      case TerrainTypes.INDUSTRIAL_ZONE:
        fill = "#3a3a00";
        break;
    }
  }

  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    fill: fill,
    stroke: stroke,
    strokeWidth: 2,
    rotation: 60,
    opacity: 0.5,
  };
}

function getTerrainTextConfig(hex: APIHex) {
  let text = "";
  switch (hex.terrain) {
    case TerrainTypes.ASTEROID_FIELD:
      text = "🪨";
      break;
    case TerrainTypes.DEBRIS_FIELD:
      text = "🗑️";
      break;
    case TerrainTypes.NEBULA:
      text = "🌫️";
      break;
    case TerrainTypes.GAS_CLOUD:
      text = "☁️";
      break;
    case TerrainTypes.GRAVITY_WELL:
      text = "⚫";
      break;
    case TerrainTypes.RADIATION_STORM:
      text = "☢️";
      break;
    case TerrainTypes.INDUSTRIAL_ZONE:
      text = "🏭";
      break;
  }
  return {
    text,
    fontSize: 32,
    offsetX: 16,
    offsetY: 16,
    listening: false,
  };
}

function getCoordTextConfig(hex: APIHex) {
  return {
    text: `${hex.location.q},${hex.location.r}`,
    fontSize: 12,
    fill: "#888",
    y: 32,
    offsetX: 16,
    listening: false,
  };
}

function getStationAt(hex: APIHex) {
  return galaxyStore.stations.find(
    (s) => s.location.q === hex.location.q && s.location.r === hex.location.r
  );
}

function getPlanetAt(hex: APIHex) {
  return galaxyStore.planets.find(
    (p) => p.location.q === hex.location.q && p.location.r === hex.location.r
  );
}

function isSelected(hex: APIHex) {
  if (!galaxyStore.selectedHex) return false;
  return galaxyStore.selectedHex._id === hex._id;
}

function getSelectionConfig() {
  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    stroke: "rgba(255, 255, 255, 1)",
    strokeWidth: 4,
    rotation: 60,
    listening: false,
  };
}

function handleClick(hex: APIHex) {
  galaxyStore.selectHex(hex);
}
</script>
