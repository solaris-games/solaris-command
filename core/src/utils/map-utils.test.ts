import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import { MapUtils } from "./map-utils";
import { Unit, UnitStatus } from "../models/unit";
import { Hex } from "../models";

// We need to mock the catalog to control ZOC
vi.mock("../data", () => ({
  UNIT_CATALOG_ID_MAP: new Map([
    [
      "unit_frigate_01",
      {
        id: "unit_frigate_01",
        class: "FRIGATE",
        stats: { zoc: true }, // Frigates exert ZOC in this test scenario
      },
    ],
    [
      "unit_corvette_01",
      {
        id: "unit_corvette_01",
        class: "CORVETTE",
        stats: { zoc: false }, // Corvettes do NOT exert ZOC
      },
    ],
  ]),
}));

// --- FACTORY ---
function createTestUnit(
  playerId: ObjectId,
  catalogId: string,
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
    steps: [{ isSuppressed: false, specialistId: null }], // Not used in ZOC calc
    state: {
      status: UnitStatus.IDLE,
      ap: 1,
      mp: 1,
    },
    supply: { isInSupply: true, ticksLastSupply: 0, ticksOutOfSupply: 0 },
    movement: { path: [] },
    combat: { location: null },
  } as unknown as Unit;
}

describe("MapUtils", () => {
  const player1Id = new ObjectId();
  const player2Id = new ObjectId();

  describe("isHexInEnemyZOC", () => {
    it("should return false if no ZOC in hex", () => {
      const hex: Hex = {
        zoc: [],
      } as any;

      expect(MapUtils.isHexInEnemyZOC(hex, player1Id)).toBe(false);
    });

    it("should return false if ZOC is only from self", () => {
      const hex: Hex = {
        zoc: [
          {
            playerId: player1Id,
            unitId: new ObjectId(),
          },
        ],
      } as Hex;

      expect(MapUtils.isHexInEnemyZOC(hex, player1Id)).toBe(false);
    });

    it("should return true if ZOC is from enemy", () => {
      const hex: Hex = {
        zoc: [
          {
            playerId: player2Id,
            unitId: new ObjectId(),
          },
        ],
      } as Hex;

      expect(MapUtils.isHexInEnemyZOC(hex, player1Id)).toBe(true);
    });

    it("should return true if ZOC is mixed (self + enemy)", () => {
      const hex: Hex = {
        zoc: [
          {
            playerId: player1Id,
            unitId: new ObjectId(),
          },
          {
            playerId: player2Id,
            unitId: new ObjectId(),
          },
        ],
      } as Hex;

      expect(MapUtils.isHexInEnemyZOC(hex, player1Id)).toBe(true);
    });
  });
});
