import { ObjectId } from "mongodb";
import { HexCoords } from "../types/geometry";
import { SupplyTarget } from "../types/supply";

export enum TerrainTypes {
  // Standard Open Space
  // Effect: Base movement, full Armor shifts allowed.
  EMPTY = "EMPTY",

  // Defensive Cover
  // Effect: Moderate Move penalty. Defense bonus.
  // Mechanical logic: 'Screening' ships (Frigates) excel here; Capital ships lose "Armor" bonuses.
  ASTEROID_FIELD = "ASTEROID_FIELD",
  DEBRIS_FIELD = "DEBRIS_FIELD",

  // Heavy Slowdown
  // Effect: High Move penalty. No supply trace?
  // Mechanical logic: Dangerous to traverse, units might get stuck or ambushed.
  NEBULA = "NEBULA",
  GAS_CLOUD = "GAS_CLOUD",

  // Impassable/Extreme
  // Effect: Impassable to most units or 3x Move Cost.
  // Mechanical logic: Strategic walls that funnel movement.
  GRAVITY_WELL = "GRAVITY_WELL", // Near stars/black holes
  RADIATION_STORM = "RADIATION_STORM",

  // Urban/Fortified
  // Effect: Massive Defense bonus.
  // Mechanical logic: Megastructures provide high defense.
  INDUSTRIAL_ZONE = "INDUSTRIAL_ZONE",
}

export interface Hex {
  _id: ObjectId;
  gameId: ObjectId;
  unitId: ObjectId | null; // One unit per hex.
  playerId: ObjectId | null;

  coords: HexCoords; // { q, r, s }
  terrain: TerrainTypes;
  supply: SupplyTarget;
  // TODO: Do we need this? Can we infer it from the terrain types?
  isImpassable: boolean; // Blocks movement completely
}
