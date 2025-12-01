export enum UnitClasses {
  FRIGATE = "FRIGATE", // High initiative
  DESTROYER = "DESTROYER", // Mid initiative
  BATTLESHIP = "BATTLESHIP", // Low initiative
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
    maxSteps: number;

    // Combat Order (Lower = Acts sooner)
    initiative: number;

    // Zone of Control
    hasZOC: boolean; // Smaller units may not have a ZOC influence
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
