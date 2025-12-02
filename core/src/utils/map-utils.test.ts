import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import { MapUtils } from "./map-utils";
import { Unit, UnitStatuses } from "../models/unit";
import { HexUtils } from "./hex-utils";
import { UNIT_CATALOG_ID_MAP } from "../data";

// --- MOCKS ---
const MOCK_FRIGATE_ID = "unit_frigate_01";
const MOCK_CORVETTE_ID = "unit_corvette_01";

// We need to mock the catalog to control hasZOC
vi.mock("../data", () => ({
  UNIT_CATALOG_ID_MAP: new Map([
    [
      "unit_frigate_01",
      {
        id: "unit_frigate_01",
        class: "FRIGATE",
        stats: { hasZOC: true }, // Frigates exert ZOC in this test scenario
      },
    ],
    [
      "unit_corvette_01",
      {
        id: "unit_corvette_01",
        class: "CORVETTE",
        stats: { hasZOC: false }, // Corvettes do NOT exert ZOC
      },
    ],
  ]),
}));

// --- FACTORY ---
function createTestUnit(
  playerId: string,
  catalogId: string,
  activeSteps: number = 5,
  q: number = 0,
  r: number = 0,
  s: number = 0
): Unit {
  return {
    _id: new ObjectId(),
    gameId: new ObjectId(),
    playerId: new ObjectId(playerId),
    catalogId: catalogId,
    location: { q, r, s },
    steps: [], // Not used in ZOC calc
    state: {
      status: UnitStatuses.IDLE,
      ap: 1,
      mp: 1,
      activeSteps: activeSteps,
      suppressedSteps: 0,
    },
    supply: { isInSupply: true, ticksLastSupply: 0, ticksOutOfSupply: 0 },
    movement: { path: [] },
    combat: { targetHex: null, cooldownEndTick: null },
  } as unknown as Unit;
}

describe("MapUtils", () => {
  const player1Id = new ObjectId().toString();
  const player2Id = new ObjectId().toString();

  describe("calculateZOCMap", () => {
    it("should project ZOC into all 6 adjacent hexes for a valid unit", () => {
      const unit = createTestUnit(player1Id, MOCK_FRIGATE_ID); // At 0,0,0
      const units = [unit];

      const zocMap = MapUtils.calculateZOCMap(units);

      // Should have entries for all 6 neighbors
      const neighbors = HexUtils.neighbors(unit.location);
      neighbors.forEach((n) => {
        const hexId = HexUtils.getID(n);
        expect(zocMap.has(hexId)).toBe(true);
        expect(zocMap.get(hexId)?.has(player1Id)).toBe(true);
      });
    });

    it("should NOT project ZOC if unit type has hasZOC: false", () => {
      const unit = createTestUnit(player1Id, MOCK_CORVETTE_ID);
      const units = [unit];

      const zocMap = MapUtils.calculateZOCMap(units);

      // Should be empty
      expect(zocMap.size).toBe(0);
    });

    it("should NOT project ZOC if unit is fully suppressed (0 active steps)", () => {
      const unit = createTestUnit(player1Id, MOCK_FRIGATE_ID, 0); // 0 Active Steps
      const units = [unit];

      const zocMap = MapUtils.calculateZOCMap(units);

      expect(zocMap.size).toBe(0);
    });

    it("should handle overlapping ZOC from multiple units/players", () => {
      // Unit 1 at 0,0,0
      const u1 = createTestUnit(player1Id, MOCK_FRIGATE_ID, 5, 0, 0, 0);
      // Unit 2 at 2,0,-2 (Distance 2 away, shares a neighbor at 1,0,-1)
      const u2 = createTestUnit(player2Id, MOCK_FRIGATE_ID, 5, 2, 0, -2);

      const units = [u1, u2];
      const zocMap = MapUtils.calculateZOCMap(units);

      // Check the shared hex (1, 0, -1)
      // It is a neighbor of 0,0,0 (East) AND a neighbor of 2,0,-2 (West)
      const sharedHexId = "1,0,-1";

      expect(zocMap.has(sharedHexId)).toBe(true);
      const exertors = zocMap.get(sharedHexId);

      expect(exertors?.size).toBe(2);
      expect(exertors?.has(player1Id)).toBe(true);
      expect(exertors?.has(player2Id)).toBe(true);
    });
  });

  describe("isHexInEnemyZOC", () => {
    const zocMap = new Map<string, Set<string>>();
    const hexId = "1,0,-1";

    it("should return false if no ZOC in hex", () => {
      expect(MapUtils.isHexInEnemyZOC(hexId, player1Id, zocMap)).toBe(false);
    });

    it("should return false if ZOC is only from self", () => {
      zocMap.set(hexId, new Set([player1Id]));
      expect(MapUtils.isHexInEnemyZOC(hexId, player1Id, zocMap)).toBe(false);
    });

    it("should return true if ZOC is from enemy", () => {
      zocMap.set(hexId, new Set([player2Id]));
      expect(MapUtils.isHexInEnemyZOC(hexId, player1Id, zocMap)).toBe(true);
    });

    it("should return true if ZOC is mixed (self + enemy)", () => {
      zocMap.set(hexId, new Set([player1Id, player2Id]));
      // Still true because an enemy exerts ZOC there, making movement hard
      expect(MapUtils.isHexInEnemyZOC(hexId, player1Id, zocMap)).toBe(true);
    });
  });
});
