import { ObjectId } from "mongodb";
import { HexCoords } from "../types/geometry";

export enum TerrainTypes {
  // Standard Open Space
  // Effect: Base movement, full Armor shifts allowed.
  EMPTY = "EMPTY",

  // Defensive Cover
  // Effect: Moderate Move penalty. Defense bonus.
  // Mechanical logic: 'Screening' ships (Frigates) excel here; Attackers lose "Armor" bonuses.
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
  RADIATION_STORM = "RADIATION_STORM",

  // Urban/Fortified
  // Effect: Massive Defense bonus.
  // Mechanical logic: Megastructures provide high defense. Attackers lose "Armor" bonuses.
  INDUSTRIAL_ZONE = "INDUSTRIAL_ZONE",
}

export interface Hex {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId | null;
  planetId: ObjectId | null;
  stationId: ObjectId | null;
  unitId: ObjectId | null; // One unit per hex.

  location: HexCoords; // { q, r, s }
  terrain: TerrainTypes;

  // TODO: Add ZoC influence
  // TODO: Add supply
}
