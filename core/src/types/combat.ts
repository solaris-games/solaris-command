import { HexCoords } from "./geometry";
import { UnifiedId } from "./unified-id";

export enum CombatResultType {
  MISS = "MISS",
  SUPPRESS = "SUPPRESS",
  RETREAT = "RETREAT",
  SHATTERED = "SHATTERED",
}

export enum CombatShiftType {
  ARMOR = "ARMOR",
  ARMOR_TERRAIN_PENALTY = "ARMOR_TERRAIN_PENALTY",
  ARMOR_TORPEDO_PENALTY = "ARMOR_TORPEDO_PENALTY",
  STEALTH = "STEALTH",
  ARTILLERY = "ARTILLERY",
  ENTRENCHMENT = "ENTRENCHMENT",
  FORTIFICATIONS = "FORTIFICATIONS",
  SIEGE = "SIEGE",
  DEFENDER_DISORGANISED = "DEFENDER_DISORGANISED"
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
}

export interface CombatForcedResult {
  resultType: CombatResultType;
  attacker: CombatLosses;
  defender: {
    losses: number;
    suppressed: number;
    retreat: boolean;
  };
}

export interface CombatReport {
  tick: number;

  attackerPlayerId: UnifiedId;
  attackerUnitId: UnifiedId;

  defenderPlayerId: UnifiedId;
  defenderUnitIt: UnifiedId;

  hexId: UnifiedId;
  location: HexCoords;

  // The "Dice Roll" outcome
  odds: string; // e.g. "3:1"
  roll: number;
  outcome: CombatResultType;

  attacker: {
    combatValue: number; // Total attack value * number of active steps
    shifts: CombatShift[];
    losses: CombatLosses;
  };

  defender: {
    combatValue: number;
    shifts: CombatShift[];
    losses: CombatLosses;
    retreated: boolean;
    shattered: boolean; // If retreat was impossible
  };
}
