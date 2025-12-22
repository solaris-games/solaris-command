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

      <!-- Unit? -->
      <v-group v-if="getUnitAt(hex)" :config="{ y: 5 }">
        <v-circle :config="getUnitCircleConfig(getUnitAt(hex)!)" />
        <v-text :config="getUnitTextConfig(getUnitAt(hex)!)" />
        <v-rect :config="getUnitHealthBarConfig(getUnitAt(hex)!)" />
      </v-group>

      <!-- Station? -->
      <v-group v-if="getStationAt(hex)" :config="{ x: -15, y: -15 }">
        <v-text :config="{ text: '🏗️', fontSize: 16 }" />
      </v-group>

      <!-- Planet? -->
      <v-group v-if="getPlanetAt(hex)" :config="{ x: 10, y: -15 }">
        <v-text :config="{ text: '🪐', fontSize: 20 }" />
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
        :config="getSupplyCircleConfig(source)"
      />
    </v-group>
  </v-layer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../stores/galaxy";
import { hexToPixel } from "../utils/hexUtils";
import { TerrainTypes } from "@solaris-command/core";
import type { GameGalaxyResponseSchema } from "@solaris-command/core";
import { HexUtils, SupplyEngine } from "@solaris-command/core";

type APIHex = GameGalaxyResponseSchema["hexes"][0];
type APIUnit = GameGalaxyResponseSchema["units"][0];

const HEX_SIZE = 40;
const galaxyStore = useGalaxyStore();

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
    galaxyStore.hexes as any,
    galaxyStore.planets as any,
    galaxyStore.stations as any
  );

  for (const id of supplyNetwork) {
    const hex = galaxyStore.hexes.find(
      (h) => HexUtils.getCoordsID(h.location) === id
    )!;

    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
    sources.push({ id: `h-${hex._id}`, x, y, range: 0.3 });
  }

  return sources;
});

function getSupplyCircleConfig(source: {
  x: number;
  y: number;
  range: number;
}) {
  return {
    x: source.x,
    y: source.y,
    radius: source.range * HEX_WIDTH,
    fill: "rgba(0, 255, 0, 0.1)",
    stroke: "rgba(0, 255, 0, 0.3)",
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
    if (hex.playerId === galaxyStore.currentPlayerId) {
      fill = "#1a2a1a"; // Slight green tint
      stroke = "#4CAF50";
    } else {
      fill = "#2a1a1a"; // Slight red tint
      stroke = "#F44336";
    }
  }

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

  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    fill: fill,
    stroke: stroke,
    strokeWidth: 2,
    rotation: 60,
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
    fontSize: 20,
    offsetX: 10,
    offsetY: 10,
    listening: false,
  };
}

function getCoordTextConfig(hex: APIHex) {
  return {
    text: `${hex.location.q},${hex.location.r}`,
    fontSize: 10,
    fill: "#888",
    y: 20,
    offsetX: 10,
    listening: false,
  };
}

function getUnitAt(hex: APIHex) {
  return galaxyStore.units.find(
    (u) => u.location.q === hex.location.q && u.location.r === hex.location.r
  );
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

function getUnitCircleConfig(unit: APIUnit) {
  const isMine = unit.playerId === galaxyStore.currentPlayerId;
  return {
    radius: 12,
    fill: isMine ? "#4CAF50" : "#F44336",
    stroke: "white",
    strokeWidth: 2,
  };
}

function getUnitTextConfig(unit: APIUnit) {
  // Determine symbol based on type
  let symbol = "🚀"; // Default

  return {
    text: symbol,
    fontSize: 14,
    offsetX: 7,
    offsetY: 7,
    listening: false,
  };
}

function getUnitHealthBarConfig(unit: APIUnit) {
  const totalSteps = unit.steps.length;
  const activeSteps = unit.steps.filter((s) => !s.isSuppressed).length; // API uses isSuppressed boolean
  const pct = totalSteps > 0 ? activeSteps / totalSteps : 0;

  return {
    width: 20,
    height: 4,
    x: -10,
    y: 15,
    fill: pct > 0.5 ? "#0f0" : "#f00",
    stroke: "black",
    strokeWidth: 1,
  };
}

function isSelected(hex: APIHex) {
  if (!galaxyStore.selected) return false;

  // Hex selection
  if (
    galaxyStore.selected.type === "HEX" &&
    galaxyStore.selected.id === hex._id
  )
    return true;

  // Unit selection on this hex
  if (galaxyStore.selected.type === "UNIT") {
    const u = getUnitAt(hex);
    if (u && u._id === galaxyStore.selected.id) return true;
  }

  return false;
}

function getSelectionConfig() {
  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    stroke: "cyan",
    strokeWidth: 4,
    rotation: 60,
    listening: false,
  };
}

function handleClick(hex: APIHex) {
  galaxyStore.selectHex(hex);
}
</script>
