import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupplyEngine } from "./supply-engine";
import { Pathfinding } from "./pathfinding";
import {
  Planet,
  Station,
  Unit,
  UnitStatus,
  Hex,
  TerrainTypes,
} from "../models";
import { CONSTANTS } from "../data";
import { MockUnifiedId } from "../types";

// --- MOCKS ---
// We mock Pathfinding because calculating the exact flood fill is tested in pathfinding.test.ts.
// Here we just want to ensure the Supply Engine chains the logic correctly.
vi.mock("./pathfinding", () => ({
  Pathfinding: {
    getReachableHexes: vi.fn(),
  },
}));

// --- FACTORIES ---
function createHex(q: number, r: number, s: number): Hex {
  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    planetId: null,
    stationId: null,
    unitId: null,
    playerId: null,
    location: { q, r, s },
    terrain: TerrainTypes.EMPTY,
    zoc: []
  };
}

function createPlanet(
  playerId: MockUnifiedId,
  q: number,
  r: number,
  s: number,
  isCapital: boolean
): Planet {
  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    playerId,
    name: "Test Planet",
    hexId: new MockUnifiedId(),
    location: { q, r, s },
    isCapital,
    supply: {
      isInSupply: true,
      isRoot: isCapital,
    },
  };
}

function createStation(
  playerId: MockUnifiedId,
  q: number,
  r: number,
  s: number
): Station {
  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    playerId,
    hexId: new MockUnifiedId(),
    location: { q, r, s },
    supply: {
      isInSupply: false, // Dynamic
      isRoot: false,
    },
  };
}

function createUnit(playerId: MockUnifiedId, q: number, r: number, s: number): Unit {
  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    playerId,
    catalogId: "unit_frigate_01",
    location: { q, r, s },
    steps: [],
    state: {
      status: UnitStatus.IDLE,
      ap: 1,
      mp: 1,
    },
    movement: { path: [] },
    combat: { location: null },
    supply: { isInSupply: true, ticksLastSupply: 0, ticksOutOfSupply: 0 },
    zoc: []
  } as any; // Casting for brevity
}

describe("SupplyEngine", () => {
  const playerId = new MockUnifiedId();
  let hexes: Hex[] = []

  beforeEach(() => {
    vi.clearAllMocks();
    
    hexes = [createHex(0, 0, 0), createHex(1, 0, -1), createHex(2, 0, -2)]; // Minimal map
  });

  describe("calculatePlayerSupplyNetwork", () => {
    it("should supply hexes around a Capital Planet", () => {
      const capital = createPlanet(playerId, 0, 0, 0, true);

      // Mock Pathfinding to return specific hexes
      vi.mocked(Pathfinding.getReachableHexes).mockReturnValue(
        new Set(["0,0,0", "1,0,-1"])
      );

      const result = SupplyEngine.calculatePlayerSupplyNetwork(
        playerId,
        hexes,
        [capital],
        [],
        []
      );

      expect(result.has("0,0,0")).toBe(true);
      expect(result.has("1,0,-1")).toBe(true);
      expect(result.size).toBe(2);

      // Verify Pathfinding was called correctly with correct args
      expect(Pathfinding.getReachableHexes).toHaveBeenCalledWith(
        capital.location,
        CONSTANTS.SUPPLY_RANGE_MP_ROOT,
        expect.any(Map),
        playerId
      );
    });

    it("should NOT supply hexes around a non-capital planet if not connected", () => {
      // Non-capitals are not roots, so they don't start the chain
      const planet = createPlanet(playerId, 0, 0, 0, false);

      const result = SupplyEngine.calculatePlayerSupplyNetwork(
        playerId,
        hexes,
        [planet],
        [],
        []
      );

      expect(result.size).toBe(0);
    });

    it("should daisy-chain supply through Stations", () => {
      // Setup: Capital at 0,0,0. Station at 1,0,-1.
      // Logic: Capital supplies 0,0,0 AND 1,0,-1.
      // Station is at 1,0,-1, so it should Activate and supply 2,0,-2.

      const capital = createPlanet(playerId, 0, 0, 0, true);
      const station = createStation(playerId, 1, 0, -1);

      // Mock behavior:
      // 1. Capital reaches station
      vi.mocked(Pathfinding.getReachableHexes)
        .mockReturnValueOnce(new Set(["0,0,0", "1,0,-1"])) // First call (Capital)
        .mockReturnValueOnce(new Set(["1,0,-1", "2,0,-2"])); // Second call (Station)

      const result = SupplyEngine.calculatePlayerSupplyNetwork(
        playerId,
        hexes,
        [capital],
        [station],
        []
      );

      expect(result.has("0,0,0")).toBe(true);
      expect(result.has("1,0,-1")).toBe(true); // Capital reached it
      expect(result.has("2,0,-2")).toBe(true); // Station reached it
      expect(Pathfinding.getReachableHexes).toHaveBeenCalledTimes(2);
    });

    it("should NOT activate a Station if it is out of range of the Capital", () => {
      // Setup: Capital at 0,0,0. Station at 5,0,-5.
      // Capital only reaches 0,0,0. Station is unreachable.

      const capital = createPlanet(playerId, 0, 0, 0, true);
      const station = createStation(playerId, 5, 0, -5);

      vi.mocked(Pathfinding.getReachableHexes).mockReturnValueOnce(
        new Set(["0,0,0"])
      ); // Capital range

      const result = SupplyEngine.calculatePlayerSupplyNetwork(
        playerId,
        hexes,
        [capital],
        [station],
        []
      );

      expect(result.has("0,0,0")).toBe(true);
      expect(result.has("5,0,-5")).toBe(false);
      expect(Pathfinding.getReachableHexes).toHaveBeenCalledTimes(1); // Station never triggered
    });
  });

  describe("processSupplyTarget", () => {
    it("should reset counters if unit is in supply", () => {
      const unit = createUnit(playerId, 0, 0, 0);
      unit.supply.ticksOutOfSupply = 5;

      const network = new Set(["0,0,0"]);

      const supply = SupplyEngine.processSupplyTarget(unit.supply, unit.location, network);

      expect(supply.isInSupply).toBe(true);
      expect(supply.ticksOutOfSupply).toBe(0);
    });

    it("should increment counters if unit is out of supply", () => {
      const unit = createUnit(playerId, 5, 5, -10); // Far away
      unit.supply.ticksOutOfSupply = 5;

      const network = new Set(["0,0,0"]);

      const supply = SupplyEngine.processSupplyTarget(unit.supply, unit.location, network);

      expect(supply.isInSupply).toBe(false);
      expect(supply.ticksOutOfSupply).toBe(6);
    });
  });
});
