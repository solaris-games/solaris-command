import { CombatOperation, HexCoords, SupplyTarget, UnifiedId } from "../types";

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
  hexId: UnifiedId | null;
  location: HexCoords | null; // If Preparing, where are we attacking?
  operation: CombatOperation | null;
  advanceOnVictory: boolean | null;
}

export interface Unit {
  _id: UnifiedId;
  gameId: UnifiedId;
  playerId: UnifiedId;
  catalogId: string;

  hexId: UnifiedId;
  location: HexCoords;

  steps: UnitStep[];
  state: UnitState;
  movement: UnitMovement;
  combat: UnitCombat;
  supply: SupplyTarget;
}
