import { HexCoords } from "./geometry";
import { UnifiedId } from "./unified-id";

export enum CombatResultType {
  MISS = "MISS",
  SUPPRESS = "SUPPRESS",
  RETREAT = "RETREAT",
  SHATTERED = "SHATTERED",
  OVERRUN = "OVERRUN",
}

export enum CombatShiftType {
  ARMOUR = "ARMOUR",
  ARMOUR_TERRAIN_PENALTY = "ARMOUR_TERRAIN_PENALTY",
  ARMOUR_TORPEDO_PENALTY = "ARMOUR_TORPEDO_PENALTY",
  STEALTH = "STEALTH",
  ARTILLERY = "ARTILLERY",
  ENTRENCHMENT = "ENTRENCHMENT",
  FORTIFICATIONS = "FORTIFICATIONS",
  SIEGE = "SIEGE",
  DEFENDER_DISORGANISED = "DEFENDER_DISORGANISED",
}

export enum CombatOperation {
  STANDARD = "STANDARD",
  FEINT = "FEINT",
  SUPPRESSIVE_FIRE = "SUPPRESSIVE_FIRE",
}

export interface CombatShift {
  type: CombatShiftType;
  value: number;
}

export interface CombatLosses {
  losses: number;
  suppressed: number;
  disorganised: boolean;
}

export interface CombatForcedResult {
  resultType: CombatResultType;
  attacker: CombatLosses;
  defender: {
    losses: number;
    suppressed: number;
    disorganised: boolean;
    retreat: boolean;
  };
}

export interface CombatReport {
  tick: number;
  cycle: number;

  attackerPlayerId: UnifiedId;
  attackerUnitId: UnifiedId;

  defenderPlayerId: UnifiedId;
  defenderUnitId: UnifiedId;

  hexId: UnifiedId;
  location: HexCoords;

  // The "Dice Roll" outcome
  odds: string; // e.g. "3:1"
  finalScore: number;
  outcome: CombatResultType;

  attacker: {
    combatValue: number; // Total attack value * number of active steps
    shifts: CombatShift[];
    losses: CombatLosses;
    disorganised: boolean;
  };

  defender: {
    combatValue: number;
    shifts: CombatShift[];
    losses: CombatLosses;
    disorganised: boolean;
    retreated: boolean;
    shattered: boolean; // If retreat was impossible
  };
}
