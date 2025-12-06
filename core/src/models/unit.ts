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

  activeSteps: number; // e.g., 5 (Current health)
  suppressedSteps: number; // e.g., 2 (Temporarily disabled)
}

export interface UnitStep {
  isSuppressed: boolean;
  specialistId: string | null;
}

export interface UnitMovement {
  path: HexCoords[]; // List of hexes to travel
}

export interface UnitCombat {
  hexId: ObjectId | null; // If Preparing, where are we attacking?
  cooldownEndTick: number | null; // Which tick does Regrouping end?
  operation: CombatOperation | null;
}

export interface Unit {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId;
  catalogId: string;

  location: HexCoords; // TODO: This should be a hex ID or we add hexId to this model?
  steps: UnitStep[];
  state: UnitState;
  movement: UnitMovement;
  combat: UnitCombat;
  supply: SupplyTarget;
}
