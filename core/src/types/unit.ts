import { CombatOperation } from "../types/combat";
import { HexCoords } from "./geometry";
import { SupplyTarget } from "./supply";
import { UnifiedId } from "./unified-id";

export enum UnitClasses {
  CORVETTE = "CORVETTE",
  FRIGATE = "FRIGATE",
  DESTROYER = "DESTROYER",
  LIGHT_CRUISER = "LIGHT_CRUISER",
  HEAVY_CRUISER = "HEAVY_CRUISER",
  BATTLECRUISER = "BATTLECRUISER",
  BATTLESHIP = "BATTLESHIP",
  DREADNOUGHT = "DREADNOUGHT",
}

export interface UnitCatalogItem {
  id: string;
  class: UnitClasses;
  name: string;
  description: string;
  cost: number; // Prestige cost

  stats: {
    // Combat Stats
    attack: number;
    defense: number;
    armor: number;

    // Movement & Logistics
    maxAP: number;
    maxMP: number;
    defaultSteps: number; // Starting steps on deployment
    maxSteps: number;

    // Combat Order (Lower = Acts sooner)
    initiative: number;

    // Zone of Control
    zoc: boolean; // Smaller units may not have a ZOC influence

    // Vision
    los: number; // Range in hexes (must be at least 2 due to movement bounces)
  };
}

export enum SpecialistStepTypes {
  ARTILLERY = "ARTILLERY", // Indirect fire / Offensive Shift
  ENGINEERS = "ENGINEERS", // Assault / Planet Capture
  RECON = "RECON", // Vision range
  SCOUTS = "SCOUTS", // Captures adjacent hexes
  LOGISTICS = "LOGISTICS", // OOS Survival
  TORPEDO = "TORPEDO", // Anti-Capital Ship (Armor Piercing)
  ARMOR = "ARMOR", // Defensive / Anti-Specialist
  HEAVY_WEAPONS = "HEAVY_WEAPONS", // High Attack
  SHIELDS = "SHIELDS", // High Defense
  PROPULSION = "PROPULSION", // MP
  COMMAND = "COMMAND", // AP
}

export interface UnitSpecialistStepCatalogItem {
  id: string;
  type: SpecialistStepTypes;
  name: string;
  description: string;
  cost: number;
  stats: {
    attack: number;
    defense: number;
    armor: number; // Armor shift for attackers, negated vs. high defense hexes and torpedo specialists.
    artillery: number; // Artillery shift
    siege: number; // Siege shift vs. high defense hexes.
  };
  bonuses: {
    mpMultiplier: number;
    apAdd: number;
    visionAdd: number;
  };
}

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
