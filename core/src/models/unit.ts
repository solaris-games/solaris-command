import { ObjectId } from "mongodb";
import { HexCoords, SupplyTarget } from "../types";

export enum UnitStatuses {
  IDLE = "IDLE",
  MOVING = "MOVING",
  PREPARING = "PREPARING", // Locked in combat countdown
  REGROUPING = "REGROUPING", // Cooldown after combat
}

export interface UnitState {
  status: UnitStatuses;

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
  targetHex: HexCoords | null; // If Preparing, where are we attacking?
  cooldownEndTick: number | null; // Which tick does Regrouping end?
}

export interface Unit {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId;
  catalogId: string;

  location: HexCoords; // Current position
  steps: UnitStep[];
  state: UnitState;
  movement: UnitMovement;
  combat: UnitCombat;
  supply: SupplyTarget;
}
