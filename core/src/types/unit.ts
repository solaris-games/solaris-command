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
  MARINES = "MARINES", // Assault / Planet Capture
  RECON = "RECON", // Intel / ZOC movement
  LOGISTICS = "LOGISTICS", // OOS Survival
  TORPEDO = "TORPEDO", // Anti-Capital Ship (Armor Piercing)
  FLAK = "FLAK", // Defensive / Anti-Specialist
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
    armor: number;
    artillery: number;
    siege: number;
    logistics: boolean; // TODO: Implement logic in supply phase for this.
  };
}
