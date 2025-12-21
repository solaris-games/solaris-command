import { describe, it, expect, vi } from "vitest";
import { MapUtils } from "./map-utils";
import { Hex } from "../models";
import { MockUnifiedId } from "../types";

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

describe("MapUtils", () => {
  const player1Id = new MockUnifiedId();
  const player2Id = new MockUnifiedId();

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
            unitId: new MockUnifiedId(),
          },
        ],
      } as unknown as Hex;

      expect(MapUtils.isHexInEnemyZOC(hex, player1Id)).toBe(false);
    });

    it("should return true if ZOC is from enemy", () => {
      const hex: Hex = {
        zoc: [
          {
            playerId: player2Id,
            unitId: new MockUnifiedId(),
          },
        ],
      } as unknown as Hex;

      expect(MapUtils.isHexInEnemyZOC(hex, player1Id)).toBe(true);
    });

    it("should return true if ZOC is mixed (self + enemy)", () => {
      const hex: Hex = {
        zoc: [
          {
            playerId: player1Id,
            unitId: new MockUnifiedId(),
          },
          {
            playerId: player2Id,
            unitId: new MockUnifiedId(),
          },
        ],
      } as unknown as Hex;

      expect(MapUtils.isHexInEnemyZOC(hex, player1Id)).toBe(true);
    });
  });
});
