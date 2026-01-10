<template>
  <v-group :config="getUnitCounterConfig(unit)">
    <!-- background and border -->
    <v-rect :config="getUnitCounterRectConfig(unit)" />
    <!-- catalogId -->
    <v-text :config="getUnitCounterNameConfig(unit)" />
    <!-- steps -->
    <v-group
      v-for="(step, index) in getUnitSteps(unit)"
      :key="index"
      :config="getUnitStepGroupConfig(index)"
    >
      <v-rect :config="getUnitStepRectConfig(step, unit)" />
      <v-text
        v-if="step.specialistId"
        :config="getUnitStepSpecialistConfig(step)"
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
    width: COUNTER_WIDTH - 8,
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

function getUnitStepSpecialistConfig(step: APIStep) {
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
</script>
