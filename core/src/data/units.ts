import { UnitCatalogItem, UnitClasses } from "../types/unit";

export const UNIT_CATALOG: UnitCatalogItem[] = [
  // --- TIER 1: SCREENING SHIPS (Fast, No ZOC) ---
  {
    id: "unit_corvette_01",
    class: UnitClasses.CORVETTE,
    name: "Patrol Corvette",
    description:
      "Long range reconnaissance vessel. Useful for deep space scouting and harassment.",
    cost: 100,
    stats: {
      attack: 1,
      defense: 1,
      shock: 0,
      maxAP: 1,
      maxMP: 10, // Very high mobility
      defaultSteps: 1,
      maxSteps: 3,
      initiative: 1,
      zoc: false, // Cannot block movement
      los: 3
    },
  },
  {
    id: "unit_frigate_01",
    class: UnitClasses.FRIGATE,
    name: "Strike Frigate",
    description:
      "Long range screening vessel. The standard workhorse for wolf-pack tactics and screening larger fleets.",
    cost: 150,
    stats: {
      attack: 2,
      defense: 2,
      shock: 0,
      maxAP: 1,
      maxMP: 8,
      defaultSteps: 2,
      maxSteps: 4,
      initiative: 1,
      zoc: false, // Too small to block effectively
      los: 3
    },
  },

  // --- TIER 2: ESCORT & RAIDING (Balanced, ZOC Capable) ---
  {
    id: "unit_destroyer_01",
    class: UnitClasses.DESTROYER,
    name: "Heavy Destroyer",
    description:
      "Balanced combat vessel. Provides essential anti-screen firepower and can lock down space lanes with Zone of Control.",
    cost: 200,
    stats: {
      attack: 4,
      defense: 3,
      shock: 1, // Light shock
      maxAP: 1,
      maxMP: 7,
      defaultSteps: 2,
      maxSteps: 4,
      initiative: 2,
      zoc: true,
      los: 2
    },
  },
  {
    id: "unit_cruiser_light_01",
    class: UnitClasses.LIGHT_CRUISER,
    name: "Interdictor Cruiser",
    description:
      "A 'Glass Cannon' designed for raiding. High firepower and speed, but sacrifices shock for mobility.",
    cost: 250,
    stats: {
      attack: 5, // High threat
      defense: 2, // Weak defense
      shock: 0, // No heavy shock
      maxAP: 1,
      maxMP: 7, // Fast
      defaultSteps: 3,
      maxSteps: 5,
      initiative: 2,
      zoc: true,
      los: 2
    },
  },

  // --- TIER 3: CAPITAL SHIPS (Line Battle) ---
  {
    id: "unit_cruiser_heavy_01",
    class: UnitClasses.HEAVY_CRUISER,
    name: "Armoured Cruiser",
    description:
      "A durable line combatant. Trades the range of light cruisers for heavy plating and sustained combat endurance.",
    cost: 300,
    stats: {
      attack: 5,
      defense: 4,
      shock: 2, // Good shock
      maxAP: 1,
      maxMP: 6,
      defaultSteps: 3,
      maxSteps: 5,
      initiative: 3,
      zoc: true,
      los: 2
    },
  },
  {
    id: "unit_battlecruiser_01",
    class: UnitClasses.BATTLECRUISER,
    name: "Battlecruiser",
    description:
      "The hunter of capitals. Mounts battleship-grade weaponry on a cruiser hull. Devastating on the attack but cannot sustain prolonged fire.",
    cost: 350,
    stats: {
      attack: 7, // Battleship guns
      defense: 3, // Cruiser hull
      shock: 1, // Weak shock for a capital
      maxAP: 1,
      maxMP: 6, // Fast for a capital
      defaultSteps: 4,
      maxSteps: 6,
      initiative: 3,
      zoc: true,
      los: 2
    },
  },

  // --- TIER 4: SUPER CAPITALS (Siege & Anchor) ---
  {
    id: "unit_battleship_01",
    class: UnitClasses.BATTLESHIP,
    name: "Capital Battleship",
    description:
      "Heavily armoured behemoth. Short range, but possesses devastating firepower and the shock to shrug off lighter attacks.",
    cost: 400,
    stats: {
      attack: 6,
      defense: 6,
      shock: 3, // Heavy Shock
      maxAP: 1,
      maxMP: 5,
      defaultSteps: 4,
      maxSteps: 6,
      initiative: 4, // Acts late
      zoc: true,
      los: 1
    },
  },
  {
    id: "unit_dreadnought_01",
    class: UnitClasses.DREADNOUGHT,
    name: "Planetary Siege Dreadnought",
    description:
      "The ultimate projection of power. Short range and expensive, but nearly impervious to standard weapons.",
    cost: 500,
    stats: {
      attack: 9,
      defense: 8,
      shock: 4, // Super Heavy Shock (Requires Torpedoes to scratch)
      maxAP: 1,
      maxMP: 3, // Crawls
      defaultSteps: 5,
      maxSteps: 7, // Huge HP pool
      initiative: 4,
      zoc: true, // Zone of control
      los: 1 // Line of sight (hex range)
    },
  },
];

// Helper Map for O(1) Lookups by Class
export const UNIT_CATALOG_MAP = new Map<UnitClasses, UnitCatalogItem>(
  UNIT_CATALOG.map((u) => [u.class, u])
);

// Helper to find by ID
export const UNIT_CATALOG_ID_MAP = new Map<string, UnitCatalogItem>(
  UNIT_CATALOG.map((s) => [s.id, s])
);
