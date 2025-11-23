import { ObjectId } from 'mongodb';
import { HexCoords } from "./geometry";

export enum CombatResultType {
  MISS = 'MISS',
  SUPPRESS = 'SUPPRESS',
  RETREAT = 'RETREAT',
  SHATTERED = 'SHATTERED'
}

export enum CombatShiftType {
  ARMOR = 'ARMOR',
  ARTILLERY = 'ARTILLERY',
  ENTRENCHMENT = 'ENTRENCHMENT',
  FORTIFICATIONS = 'FORTIFICATIONS',
  SIEGE = 'SIEGE'
}

export interface CombatShift {
  type: CombatShiftType
  value: number
}

export interface CombatReport {
  tick: number;
  attackerId: ObjectId;
  defenderId: ObjectId;
  hex: HexCoords;
  
  // The "Dice Roll" outcome
  odds: string; // e.g. "3:1"
  roll: number;

  attacker: {
    combatValue: number; // Total attack value * number of active steps
    shifts: CombatShift[]
    losses: {
      steps: number;
      suppressed: number;
    };
  };

  defender: {
    combatValue: number;
    shifts: CombatShift[]
    losses: {
      steps: number;
      suppressed: number;
    };
    retreated: boolean;
    shattered: boolean; // If retreat was impossible
  };
}