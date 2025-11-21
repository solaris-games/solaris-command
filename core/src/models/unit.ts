import { ObjectId } from 'mongodb';
import { HexCoords } from '../types/geometry';
import { SupplyTarget } from '../types/supply';
import { SpecialistTypes, UnitStatuses, UnitClasses } from '../types/unit';

export interface UnitStats {
  ap: number;              // Action Points (Refills every cycle)
  mp: number;              // Movement Points (Refills every cycle)
  
  initiative: number;      // Used in combat to determine which unit goes first in the case of multiple attacks on a single hex.
  maxSteps: number;        // e.g., 7 (Standard unit size)
  activeSteps: number;     // e.g., 5 (Current health)
  suppressedSteps: number; // e.g., 2 (Temporarily disabled)
  
  attack: number;          // Base attack value
  defense: number;         // Base defense value
  armor: number;           // Armor shift (shift results from Kill -> Suppress)

  combatAttackValue: number;     // (base attack * active steps) + specialist(s) attack
  combatDefenseValue: number;    // (base defense * active steps) + specialist(s) defense

  maxAP: number;           // Max action points per cycle
  maxMP: number;           // Max movement points per cycle
}

export interface UnitSpecialist {
  id: string
  name: string
  description: string
  cost: number
  type: SpecialistTypes;
  stats: {
    // Combat Stats
    attack: number;          // Base attack addition
    defense: number;         // Base defense addition
    
    // Shifts (The "Dice Roll" modifiers)
    armor: number;           // Armor shift (Reduces incoming damage severity)
    artillery: number;       // Artillery shift (Offensive bonus without risk)
    siege: number;           // Shift vs. Planets/Stations (Bunker buster)
    
    // Utility
    logistics: boolean;      // If true, extends OOS grace period by 1 Cycle
  }
}

export interface UnitStep {
  isSuppressed: boolean
  specialist: UnitSpecialist | null
}

export interface UnitMovement {
  path: HexCoords[];       // List of hexes to travel
}

export interface UnitCombat {
  targetHex: HexCoords | null; // If Preparing, where are we attacking?
  cooldownEndTick: number | null;     // Which tick does Regrouping end?
  combatTriggerTick: number | null;   // Which tick does the Attack land?
}

export interface Unit {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId;
  
  name: string;
  class: UnitClasses;
  location: HexCoords; // Current position
  status: UnitStatuses;
  steps: UnitStep[];
  stats: UnitStats;
  movement: UnitMovement;
  combat: UnitCombat;
  supply: SupplyTarget;
}