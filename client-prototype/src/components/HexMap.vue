<template>
  <v-layer>
    <!-- 1. Hexes -->
    <v-group
      v-for="hex in galaxyStore.hexes"
      :key="`hex-${hex.location.q},${hex.location.r}`"
      :config="getHexConfig(hex)"
    >
      <Hexagon :hex="hex" />
    </v-group>

    <!-- 2. Overlays -->
    <v-group v-if="galaxyStore.showSupply">
      <v-circle
        v-for="source in supplySources"
        :key="source.id"
        :config="getSupplyHexCircleConfig(source)"
      />
    </v-group>
    <v-group v-if="galaxyStore.showZOC">
      <v-circle
        v-for="source in zocSources"
        :key="source.id"
        :config="getZOCHexCircleConfig(source)"
      />
    </v-group>

    <!-- 3. Arrows -->
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

    <!-- 4. Counters -->
    <v-group
      v-for="hex in galaxyStore.hexes"
      :key="`counter-${hex.location.q},${hex.location.r}`"
      :config="getHexConfig(hex)"
    >
      <UnitCounter v-if="getUnitAt(hex)" :unit="getUnitAt(hex)!" />
      <Station v-if="getStationAt(hex)" :station="getStationAt(hex)!" />
      <Planet v-if="getPlanetAt(hex)" :planet="getPlanetAt(hex)!" />
    </v-group>

    <!-- 5. Selection and Interaction Layer -->
    <v-group
      v-for="hex in galaxyStore.hexes"
      :key="`interaction-${hex.location.q},${hex.location.r}`"
      :config="getHexConfig(hex)"
      @click="handleClick(hex)"
      @tap="handleClick(hex)"
    >
      <v-regular-polygon :config="getInteractionHexConfig()" />
      <v-regular-polygon
        v-if="isSelected(hex)"
        :config="getSelectionConfig()"
      />
    </v-group>
  </v-layer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "../stores/galaxy";
import { hexToPixel } from "../utils/hexUtils";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { SupplyEngine } from "@solaris-command/core/src/utils/supply-engine";
import { UnitStatus } from "@solaris-command/core/src/types/unit";
import Hexagon from "./map/Hexagon.vue";
import UnitCounter from "./map/UnitCounter.vue";
import Station from "./map/Station.vue";
import Planet from "./map/Planet.vue";
import AttackArrow from "./map/AttackArrow.vue";
import MovementPath from "./map/MovementPath.vue";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

const attackingUnits = computed(() =>
  galaxyStore.units.filter((u) => u.state.status === UnitStatus.PREPARING)
);
const movingUnits = computed(() =>
  galaxyStore.units.filter((u) => u.state.status === UnitStatus.MOVING)
);

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

function getInteractionHexConfig() {
  return {
    sides: 6,
    radius: HEX_SIZE,
    opacity: 0,
  };
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
