import { ObjectId } from "mongodb";
import { CombatOperation, HexCoords, SupplyTarget } from "../types";

export enum UnitStatus {
  IDLE = "IDLE",
  MOVING = "MOVING",
  PREPARING = "PREPARING", // Locked in combat countdown
  REGROUPING = "REGROUPING", // Cooldown after combat
}

export interface UnitState {
  status: UnitStatus;
  ap: number; // Action Points (Refills every cycle)
  mp: number; // Movement Points (Refills every cycle)
}

export interface UnitStep {
  isSuppressed: boolean;
  specialistId: string | null;
}

export interface UnitMovement {
  path: HexCoords[]; // List of hexes to travel
}

export interface UnitCombat {
  location: HexCoords | null; // If Preparing, where are we attacking?
  operation: CombatOperation | null;
  advanceOnVictory: boolean | null;
}

export interface Unit {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId;
  catalogId: string;

  hexId: ObjectId;
  location: HexCoords;

  steps: UnitStep[];
  state: UnitState;
  movement: UnitMovement;
  combat: UnitCombat;
  supply: SupplyTarget;
}
