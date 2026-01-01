import { CombatShift, CombatShiftType, TerrainTypes } from "../types";
import { CONSTANTS } from "./constants";

export const TERRAIN_MP_COSTS: Record<TerrainTypes, number> = {
  [TerrainTypes.EMPTY]: 1,
  [TerrainTypes.ASTEROID_FIELD]: 2,
  [TerrainTypes.DEBRIS_FIELD]: 3,
  [TerrainTypes.NEBULA]: 2,
  [TerrainTypes.GAS_CLOUD]: 2,
  [TerrainTypes.INDUSTRIAL_ZONE]: 4,
  [TerrainTypes.RADIATION_STORM]: 1,
  [TerrainTypes.GRAVITY_WELL]: 999, // Impassable
};

export const COMBAT_SHIFTS_TERRAIN: Record<TerrainTypes, CombatShift | null> = {
  [TerrainTypes.EMPTY]: null, // No shift
  [TerrainTypes.ASTEROID_FIELD]: {
    type: CombatShiftType.ENTRENCHMENT,
    value: CONSTANTS.COMBAT_SHIFT_ENTRENCHMENT_LOW, // Defender bonus
  },
  [TerrainTypes.DEBRIS_FIELD]: {
    type: CombatShiftType.ENTRENCHMENT,
    value: CONSTANTS.COMBAT_SHIFT_ENTRENCHMENT_HIGH,
  },
  [TerrainTypes.NEBULA]: {
    type: CombatShiftType.STEALTH,
    value: CONSTANTS.COMBAT_SHIFT_STEALTH_LOW, // Attacker bonus
  },
  [TerrainTypes.GAS_CLOUD]: {
    type: CombatShiftType.STEALTH,
    value: CONSTANTS.COMBAT_SHIFT_STEALTH_HIGH,
  },
  [TerrainTypes.GRAVITY_WELL]: null,
  [TerrainTypes.RADIATION_STORM]: null,
  [TerrainTypes.INDUSTRIAL_ZONE]: {
    type: CombatShiftType.FORTIFICATIONS,
    value: CONSTANTS.COMBAT_SHIFT_FORTIFICATIONS,
  },
};

export const COMBAT_SHIFT_PLANETS: CombatShift = {
  type: CombatShiftType.FORTIFICATIONS,
  value: CONSTANTS.COMBAT_SHIFT_FORTIFICATIONS,
};

export const COMBAT_SHIFT_DEFENDER_DISORGANISED: CombatShift = {
  type: CombatShiftType.DEFENDER_DISORGANISED,
  value: CONSTANTS.COMBAT_SHIFT_DEFENDER_DISORGANISED,
};
