<template>
  <v-layer :config="{ perfectDrawEnabled: false, listening: true }">
    <v-group
      v-for="hex in galaxyStore.hexes"
      :key="`interaction-${hex.location.q},${hex.location.r}`"
      :config="getHexConfig(hex)"
      :listening="!mapSettingsStore.isPinching"
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
import { useGalaxyStore } from "../../stores/galaxy";
import { useMovementStore } from "../../stores/movement";
import { useCombatStore } from "../../stores/combat";
import { useMapSettingsStore } from "../../stores/mapSettings";
import { hexToPixel } from "../../utils/hexUtils";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const movementStore = useMovementStore();
const combatStore = useCombatStore();
const mapSettingsStore = useMapSettingsStore();

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
  if (movementStore.isMoveMode) {
    movementStore.addHexToPath(hex);
  } else if (combatStore.isAttackMode) {
    const unit = galaxyStore.units.find(
      (u) => u.location.q === hex.location.q && u.location.r === hex.location.r,
    );
    if (unit) {
      const isValid = combatStore.validTargetHexes.some(
        (targetHex: any) => targetHex._id === hex._id,
      );
      if (isValid) {
        combatStore.setTarget(unit);
      }
    }
  } else {
    galaxyStore.selectHex(hex);
  }
}
</script>
