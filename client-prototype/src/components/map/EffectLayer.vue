<template>
  <v-layer :config="{ listening: false }">
    <!-- Arrows -->
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

    <!-- Overlays -->
    <v-group v-if="mapSettingsStore.showSupply">
      <v-group v-for="source in supplySources" :key="source.id">
        <v-circle :config="getSupplyHexCircleConfig(source)" />
        <v-text :config="getSupplyTextConfig(source)" />
      </v-group>
    </v-group>
    <v-group v-if="mapSettingsStore.showZOC">
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
import { useGalaxyStore } from "../../stores/galaxy";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { SupplyEngine } from "@solaris-command/core/src/utils/supply-engine";
import { UnitStatus } from "@solaris-command/core/src/types/unit";
import AttackArrow from "./AttackArrow.vue";
import MovementPath from "./MovementPath.vue";

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();

const attackingUnits = computed(() =>
  galaxyStore.units.filter((u) => u.state.status === UnitStatus.PREPARING)
);
const movingUnits = computed(() =>
  galaxyStore.units.filter((u) => u.state.status === UnitStatus.MOVING)
);

// Constants for prototype supply viz
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);

const supplySources = computed(() => {
  const sources: {
    id: string;
    x: number;
    y: number;
    range: number;
    remainingMP: number;
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

  for (const [id, remainingMP] of supplyNetwork) {
    const hex = galaxyStore.hexes.find(
      (h) => HexUtils.getCoordsID(h.location) === id
    )!;

    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
    sources.push({
      id: `h-${hex._id}`,
      x,
      y,
      range: 0.2,
      remainingMP,
    });
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
    stroke: "rgba(0, 0, 0, 1)",
    strokeWidth: 6,
    listening: false, // Click through
    dash: [10, 5],
  };
}

function getSupplyTextConfig(source: {
  x: number;
  y: number;
  remainingMP: number;
}) {
  return {
    x: source.x - 10, // Approximate centering
    y: source.y - 8,
    text: source.remainingMP.toString(),
    fontSize: 16,
    fontFamily: "monospace",
    fontStyle: "bold",
    fill: "black",
    listening: false,
    align: "center",
    width: 20,
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
    radius: (source.range * HEX_WIDTH) / 2,
    fill: "rgba(255, 255, 255, 1)",
    stroke: "rgba(0, 0, 0, 1)",
    strokeWidth: 6,
    listening: false, // Click through
  };
}
</script>
