import { UnitCatalogItem, UnitClasses } from "../types";

export const UNIT_CATALOG: UnitCatalogItem[] = [
  {
    id: "unit_frigate_01",
    class: UnitClasses.FRIGATE,
    name: "Strike Frigate",
    description:
      "Fast screening vessel. High speed allows for rapid interception and first-strike capability.",
    cost: 50,
    stats: {
      attack: 2,
      defense: 2,
      armor: 0,
      maxAP: 1,
      maxMP: 3,
      maxSteps: 7,
      initiative: 0, // Acts First
    },
  },
  {
    id: "unit_destroyer_01",
    class: UnitClasses.DESTROYER,
    name: "Heavy Destroyer",
    description: "Balanced combat vessel. The backbone of the fleet.",
    cost: 100,
    stats: {
      attack: 4,
      defense: 3,
      armor: 1,
      maxAP: 1,
      maxMP: 2,
      maxSteps: 7,
      initiative: 1,
    },
  },
  {
    id: "unit_battleship_01",
    class: UnitClasses.BATTLESHIP,
    name: "Capital Battleship",
    description:
      "Heavily armored behemoth. Slow, but possesses devastating firepower and high survivability.",
    cost: 200,
    stats: {
      attack: 6,
      defense: 5,
      armor: 2,
      maxAP: 1,
      maxMP: 1,
      maxSteps: 7,
      initiative: 2, // Acts Last
    },
  },
];

// Helper Map for O(1) Lookups
export const UNIT_CATALOG_MAP = new Map<UnitClasses, UnitCatalogItem>(
  UNIT_CATALOG.map((u) => [u.class, u])
);

// Helper to find by ID
export const UNIT_CATALOG_ID_MAP = new Map<string, UnitCatalogItem>(
  UNIT_CATALOG.map((s) => [s.id, s])
);
