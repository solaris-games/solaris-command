import { TerrainTypes } from "../models";
import { CombatShift, CombatShiftType } from "../types";

export const TERRAIN_MP_COSTS: Record<TerrainTypes, number> = {
  [TerrainTypes.EMPTY]: 1,
  [TerrainTypes.ASTEROID_FIELD]: 2,
  [TerrainTypes.DEBRIS_FIELD]: 2,
  [TerrainTypes.NEBULA]: 3,
  [TerrainTypes.GAS_CLOUD]: 3,
  [TerrainTypes.INDUSTRIAL_ZONE]: 3,
  [TerrainTypes.GRAVITY_WELL]: 999, // Impassable
  [TerrainTypes.RADIATION_STORM]: 999,
};

export const TERRAIN_COMBAT_SHIFTS: Record<TerrainTypes, CombatShift | null> = {
  [TerrainTypes.EMPTY]: null, // No shift
  [TerrainTypes.ASTEROID_FIELD]: {
    type: CombatShiftType.ENTRENCHMENT,
    value: -1, // Defender bonus
  },
  [TerrainTypes.DEBRIS_FIELD]: {
    type: CombatShiftType.ENTRENCHMENT,
    value: -2,
  },
  [TerrainTypes.NEBULA]: null,
  [TerrainTypes.GAS_CLOUD]: null,
  [TerrainTypes.GRAVITY_WELL]: null,
  [TerrainTypes.RADIATION_STORM]: null,
  [TerrainTypes.INDUSTRIAL_ZONE]: {
    type: CombatShiftType.FORTIFICATIONS,
    value: -3,
  },
};
