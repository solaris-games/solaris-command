<template>
  <v-group :config="getUnitCounterConfig(unit)">
    <!-- background and border -->
    <v-rect :config="getUnitCounterRectConfig(unit)" />
    <!-- catalogId -->
    <v-text :config="getUnitCounterNameConfig(unit)" />
    <!-- steps -->
    <v-group
      v-for="(step, index) in unit.steps"
      :key="index"
      :config="getUnitStepGroupConfig(index)"
    >
      <v-rect :config="getUnitStepRectConfig(step, unit)" />
      <v-text
        v-if="step.specialistId"
        :config="getUnitStepSpecialistConfig(step, unit)"
      />
    </v-group>
    <!-- mp -->
    <v-text :config="getUnitCounterMPConfig(unit)" />
    <!-- ap -->
    <v-text :config="getUnitCounterAPConfig(unit)" />
  </v-group>
</template>

<script setup lang="ts">
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { useGalaxyStore } from "@/stores/galaxy";
import {
  UNIT_CATALOG_ID_MAP,
  SPECIALIST_STEP_ID_MAP,
  PLAYER_COLOR_LOOKUP,
} from "@solaris-command/core/src/data";

type APIUnit = GameGalaxyResponseSchema["units"][0];
type APIStep = APIUnit["steps"][0];

const props = defineProps<{
  unit: APIUnit;
}>();

const galaxyStore = useGalaxyStore();

const COUNTER_WIDTH = 72;
const COUNTER_HEIGHT = 72;

function getPlayerColor(unit: APIUnit) {
  const player = galaxyStore.playerLookup?.get(String(unit.playerId));
  if (!player) return { background: "#FFFFFF", foreground: "#000000" };
  const color = PLAYER_COLOR_LOOKUP.get(player.color);
  return color || { background: "#FFFFFF", foreground: "#000000" };
}

function getUnitCounterConfig(unit: APIUnit) {
  return {
    x: -COUNTER_WIDTH / 2,
    y: -COUNTER_HEIGHT / 2,
  };
}

function getUnitCounterRectConfig(unit: APIUnit) {
  const color = getPlayerColor(unit);
  return {
    width: COUNTER_WIDTH,
    height: COUNTER_HEIGHT,
    fill: color.background,
    stroke: color.foreground,
    strokeWidth: 3,
    cornerRadius: 4,
    dash: !unit.supply.isInSupply ? [10, 5] : undefined,
  };
}

function getUnitCounterNameConfig(unit: APIUnit) {
  const unitCatalog = UNIT_CATALOG_ID_MAP.get(unit.catalogId);
  const color = getPlayerColor(unit);
  return {
    text: unitCatalog?.name.toUpperCase() || unit.catalogId.toUpperCase(),
    fontSize: 9,
    fontFamily: "Roboto, sans-serif",
    fill: color.foreground,
    width: COUNTER_WIDTH - 12,
    x: 0,
    y: 4,
    align: "center",
    fontStyle: "bold",
  };
}

function getUnitStepGroupConfig(index: number) {
  const STEP_SIZE = 12;
  const STEP_GAP = 4;
  const stepsPerRow = 4;
  const row = Math.floor(index / stepsPerRow);
  const col = index % stepsPerRow;
  const totalWidth = stepsPerRow * STEP_SIZE + (stepsPerRow - 1) * STEP_GAP;
  const x = col * (STEP_SIZE + STEP_GAP) + (COUNTER_WIDTH - totalWidth) / 2;
  const y = row * (STEP_SIZE + STEP_GAP) + (row === 0 ? 42 : 24);
  return { x, y };
}

function getUnitStepRectConfig(step: APIStep, unit: APIUnit) {
  const color = getPlayerColor(unit);
  return {
    width: 12,
    height: 12,
    fill: step.isSuppressed ? "transparent" : color.foreground,
    stroke: color.foreground,
    strokeWidth: 2,
    cornerRadius: 2,
  };
}

function getUnitStepSpecialistConfig(step: APIStep, unit: APIUnit) {
  const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId!);
  const initial = specialist ? specialist.type.charAt(0) : "";
  const color = getPlayerColor(unit);
  const textColor = step.isSuppressed ? color.foreground : color.background;

  return {
    text: initial,
    fontSize: 12,
    fontFamily: "Roboto, sans-serif",
    fill: textColor,
    width: 12,
    height: 12,
    align: "center",
    verticalAlign: "middle",
    fontStyle: "bold",
  };
}

function getUnitCounterMPConfig(unit: APIUnit) {
  const color = getPlayerColor(unit);
  return {
    text: `${unit.state.mp}`,
    fontSize: 10,
    fontFamily: "Roboto, sans-serif",
    fill: color.foreground,
    x: 5,
    y: COUNTER_HEIGHT - 15,
    fontStyle: "bold",
  };
}

function getUnitCounterAPConfig(unit: APIUnit) {
  const color = getPlayerColor(unit);
  return {
    text: "⚡".repeat(unit.state.ap),
    fontSize: 10,
    fontFamily: "Roboto, sans-serif",
    fill: color.foreground,
    x: COUNTER_WIDTH - (unit.state.ap > 1 ? 20 : 14),
    y: COUNTER_HEIGHT - 15,
    fontStyle: "bold",
  };
}
</script>
