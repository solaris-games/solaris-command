import { UnifiedId } from "./unified-id";
import { HexCoords } from "./geometry";

export enum TerrainTypes {
  // Standard Open Space
  // Effect: Base movement, full Shock shifts allowed.
  EMPTY = "EMPTY",

  // Defensive Cover
  // Effect: Moderate Move penalty. Defense bonus.
  // Mechanical logic: 'Screening' ships (Frigates) excel here; Attackers lose "Shock" bonuses.
  ASTEROID_FIELD = "ASTEROID_FIELD",
  DEBRIS_FIELD = "DEBRIS_FIELD",

  // Heavy Slowdown
  // Effect: High Move penalty. No supply trace?
  // Mechanical logic: Dangerous to traverse, units might get stuck or ambushed.
  NEBULA = "NEBULA",
  GAS_CLOUD = "GAS_CLOUD",

  // Impassable/Extreme
  // Effect: Impassable
  // Mechanical logic: Strategic walls that funnel movement.
  GRAVITY_WELL = "GRAVITY_WELL", // Near stars/black holes

  // Urban/Fortified
  // Effect: Massive Defense bonus.
  // Mechanical logic: Megastructures provide high defense. Attackers lose "Shock" bonuses.
  INDUSTRIAL_ZONE = "INDUSTRIAL_ZONE",

  // Dangerous
  // Effect: Units suffer step suppression in these terrains
  // Mechanical logic: Base movement, full Shock shifts allows.
  RADIATION_STORM = "RADIATION_STORM",
}

export interface HexZOCEntry {
  playerId: UnifiedId;
  unitId: UnifiedId;
}

export interface Hex {
  _id: UnifiedId;
  gameId: UnifiedId;
  playerId: UnifiedId | null;
  planetId: UnifiedId | null;
  stationId: UnifiedId | null;
  unitId: UnifiedId | null; // One unit per hex.

  location: HexCoords; // { q, r, s }
  terrain: TerrainTypes;

  // Which units have ZOC influence on this hex
  zoc: HexZOCEntry[];

  // TODO: Add supply?
}
