import { UnitSpecialistStepCatalogItem, SpecialistStepTypes } from "../types/unit";

export const SPECIALIST_STEP_CATALOG: UnitSpecialistStepCatalogItem[] = [
  {
    id: "spec_artillery_01",
    type: SpecialistStepTypes.ARTILLERY,
    name: "Artillery",
    description: "Long-range kinetic bombardment.",
    cost: 50,
    stats: {
      attack: 2,
      defense: 0,
      armour: 0,
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
    id: "spec_engineers_01",
    type: SpecialistStepTypes.ENGINEERS,
    name: "Engineers",
    description:
      "Elite infantry for boarding actions and planetary assault. Negates defensive bonuses.",
    cost: 50,
    stats: {
      attack: 1,
      defense: 1,
      armour: 0,
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
      "Advanced sensors and electronic warfare. Increases vision range.",
    cost: 50,
    stats: {
      attack: 0,
      defense: 1,
      armour: 0,
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
    id: "spec_scouts_01",
    type: SpecialistStepTypes.SCOUTS,
    name: "Scouts",
    description:
      "Captures adjacent empty hexes in the unit's zone of control under certain conditions.",
    cost: 50,
    stats: {
      attack: 0,
      defense: 0,
      armour: 0,
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
    id: "spec_torpedo_01",
    type: SpecialistStepTypes.TORPEDO,
    name: "Torpedo",
    description:
      "Dedicated anti-capital ship munitions. Negates the Armour Shift of heavy targets.",
    cost: 50,
    stats: {
      attack: 3,
      defense: 0,
      armour: 0,
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
    id: "spec_armour_01",
    type: SpecialistStepTypes.ARMOUR,
    name: "Armour",
    description:
      "Reinforced hull plating. Provides high defense and armour shift.",
    cost: 50,
    stats: {
      attack: 1,
      defense: 3,
      armour: 1,
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
    cost: 50,
    stats: {
      attack: 5,
      defense: 0,
      armour: 0,
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
    cost: 50,
    stats: {
      attack: 0,
      defense: 5,
      armour: 0,
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
    cost: 50,
    stats: {
      attack: 0,
      defense: 0,
      armour: 0,
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
    cost: 50,
    stats: {
      attack: 0,
      defense: 0,
      armour: 0,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 1,
      visionAdd: 0,
    },
  },
  {
    id: "spec_logistics_01",
    type: SpecialistStepTypes.LOGISTICS,
    name: "Logistics",
    description:
      "Enhanced logistics capacity. Allows the unit to be out of supply for 1 cycle longer.",
    cost: 50,
    stats: {
      attack: 0,
      defense: 0,
      armour: 0,
      artillery: 0,
      siege: 0,
    },
    bonuses: {
      mpMultiplier: 1,
      apAdd: 0,
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

export const SPECIALIST_STEP_SYMBOL_MAP = new Map<SpecialistStepTypes, string>([
  [SpecialistStepTypes.ARTILLERY, "⊡"],
  [SpecialistStepTypes.ENGINEERS, "⚒"],
  [SpecialistStepTypes.RECON, "⌕"],
  [SpecialistStepTypes.SCOUTS, "⧖"],
  [SpecialistStepTypes.TORPEDO, "⤇"],
  [SpecialistStepTypes.ARMOUR, "▨"],
  [SpecialistStepTypes.HEAVY_WEAPONS, "⌁"],
  [SpecialistStepTypes.SHIELDS, "⛨"],
  [SpecialistStepTypes.PROPULSION, "→"],
  [SpecialistStepTypes.COMMAND, "★"],
  [SpecialistStepTypes.LOGISTICS, "○"],
]);
