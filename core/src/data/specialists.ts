import { UnitSpecialistStepCatalogItem, SpecialistStepTypes } from "../types";

export const SPECIALIST_STEP_CATALOG: UnitSpecialistStepCatalogItem[] = [
  {
    id: "spec_artillery_01",
    type: SpecialistStepTypes.ARTILLERY,
    name: "Artillery",
    description:
      "Long-range kinetic bombardment. Applies an Artillery Shift before main combat begins.",
    cost: 150,
    stats: {
      attack: 2,
      defense: 0,
      armor: 0,
      artillery: 1,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 0,
      visionAdd: 0,
    },
  },
  {
    id: "spec_marines_01",
    type: SpecialistStepTypes.MARINES,
    name: "Engineers",
    description:
      "Elite infantry for boarding actions and planetary assault. Negates defensive bonuses of Stations and Planets.",
    cost: 100,
    stats: {
      attack: 1,
      defense: 1,
      armor: 0,
      artillery: 0,
      siege: 2,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 0,
      visionAdd: 0,
    },
  },
  {
    id: "spec_recon_01",
    type: SpecialistStepTypes.RECON,
    name: "Recon",
    description:
      "Advanced sensors and electronic warfare. Increases vision range and allows retreat through enemy ZOC.",
    cost: 75,
    stats: {
      attack: 0,
      defense: 1,
      armor: 0,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 0,
      visionAdd: 1,
    },
  },
  {
    id: "spec_torpedo_01",
    type: SpecialistStepTypes.TORPEDO,
    name: "Torpedo",
    description:
      "Dedicated anti-capital ship munitions. Negates the Armor Shift of heavy targets.",
    cost: 125,
    stats: {
      attack: 3,
      defense: 0,
      armor: 0,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 0,
      visionAdd: 0,
    },
  },
  {
    id: "spec_armor_01",
    type: SpecialistStepTypes.ARMOR,
    name: "Armor",
    description:
      "Reinforced hull plating. Provides high defense and armor shift.",
    cost: 100,
    stats: {
      attack: 1,
      defense: 3,
      armor: 1,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 0,
      visionAdd: 0,
    },
  },
  {
    id: "spec_heavy_weapons_01",
    type: SpecialistStepTypes.HEAVY_WEAPONS,
    name: "Heavy Weapons",
    description: "High caliber weaponry for increased attack power.",
    cost: 100,
    stats: {
      attack: 5,
      defense: 0,
      armor: 0,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 0,
      visionAdd: 0,
    },
  },
  {
    id: "spec_shields_01",
    type: SpecialistStepTypes.SHIELDS,
    name: "Shields",
    description: "Energy shielding for increased defense capabilities.",
    cost: 100,
    stats: {
      attack: 0,
      defense: 5,
      armor: 0,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 0,
      visionAdd: 0,
    },
  },
  {
    id: "spec_propulsion_01",
    type: SpecialistStepTypes.PROPULSION,
    name: "Propulsion",
    description: "Enhanced engines increasing maximum movement points.",
    cost: 100,
    stats: {
      attack: 0,
      defense: 0,
      armor: 0,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1.5,
      apAdd: 0,
      visionAdd: 0,
    },
  },
  {
    id: "spec_command_01",
    type: SpecialistStepTypes.COMMAND,
    name: "Command",
    description: "Tactical command center increasing action points.",
    cost: 100,
    stats: {
      attack: 0,
      defense: 0,
      armor: 0,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 1,
      visionAdd: 0,
    },
  },
];

// Helper to find by Type quickly
export const SPECIALIST_STEP_MAP = new Map<
  SpecialistStepTypes,
  UnitSpecialistStepCatalogItem
>(SPECIALIST_STEP_CATALOG.map((s) => [s.type, s]));

// Helper to find by ID
export const SPECIALIST_STEP_ID_MAP = new Map<
  string,
  UnitSpecialistStepCatalogItem
>(SPECIALIST_STEP_CATALOG.map((s) => [s.id, s]));
