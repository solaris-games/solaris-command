import { describe, it, expect } from "vitest";
import { Pathfinding } from "./pathfinding";
import { Hex, TerrainTypes } from "../models/hex";
import { HexCoords } from "../types/geometry";
import { ObjectId } from "mongodb";
import { HexUtils } from "./hex-utils";

// --- HELPER: Create a map of hexes ---
function createMap(
  width: number,
  height: number,
  terrainOverride: Map<string, TerrainTypes> = new Map()
): Map<string, Hex> {
  const map = new Map<string, Hex>();
  const gameId = new ObjectId();

  for (let q = -width; q <= width; q++) {
    for (let r = -height; r <= height; r++) {
      const s = -q - r;
      const coords = { q, r, s };
      const id = HexUtils.getCoordsID(coords);

      map.set(id, {
        _id: new ObjectId(),
        gameId: gameId,
        unitId: null,
        playerId: null,
        coords: coords,
        terrain: terrainOverride.get(id) || TerrainTypes.EMPTY,
        supply: { isInSupply: false, ticksLastSupply: 0, ticksOutOfSupply: 0 },
      });
    }
  }
  return map;
}

// --- HELPER: Create ZOC Context ---
function createZocContext(
  enemyId: string,
  hexes: string[]
): { playerId: string; zocMap: Map<string, Set<string>> } {
  const zocMap = new Map<string, Set<string>>();
  const enemySet = new Set([enemyId]);

  hexes.forEach((hexId) => {
    zocMap.set(hexId, enemySet);
  });

  return {
    playerId: "my-player-id", // I am this player
    zocMap: zocMap,
  };
}

describe("Pathfinding", () => {
  describe("getReachableHexes (Flood Fill)", () => {
    const start: HexCoords = { q: 0, r: 0, s: 0 };

    it("should return correct hexes for MP 1 (Neighbors)", () => {
      const map = createMap(3, 3);
      const reachable = Pathfinding.getReachableHexes(start, 1, map);

      // Center (0 cost) + 6 Neighbors (1 cost)
      expect(reachable.size).toBe(7);
      expect(reachable.has(HexUtils.getCoordsID(start))).toBe(true);
      expect(reachable.has("1,0,-1")).toBe(true);
    });

    it("should be blocked by Impassable terrain", () => {
      const map = createMap(3, 3);
      const neighborId = "1,0,-1";
      map.get(neighborId)!.terrain = TerrainTypes.RADIATION_STORM;

      const reachable = Pathfinding.getReachableHexes(start, 1, map);

      expect(reachable.has(neighborId)).toBe(false);
      expect(reachable.size).toBe(6); // Center + 5 neighbors
    });

    it("should cost more for difficult terrain", () => {
      const map = createMap(3, 3);
      const asteroidId = "1,0,-1"; // Cost 2
      map.get(asteroidId)!.terrain = TerrainTypes.ASTEROID_FIELD;

      // With 1 MP, cannot enter Asteroid field
      const reachable1 = Pathfinding.getReachableHexes(start, 1, map);
      expect(reachable1.has(asteroidId)).toBe(false);

      // With 2 MP, can enter
      const reachable2 = Pathfinding.getReachableHexes(start, 2, map);
      expect(reachable2.has(asteroidId)).toBe(true);
    });

    it("should double cost for ZOC", () => {
      const map = createMap(3, 3);
      const zocHexId = "1,0,-1"; // Base Cost 1
      const zocContext = createZocContext("enemy-id", [zocHexId]);

      // With ZOC, cost becomes 2.
      // MP 1 -> Fail
      const reachable1 = Pathfinding.getReachableHexes(
        start,
        1,
        map,
        zocContext
      );
      expect(reachable1.has(zocHexId)).toBe(false);

      // MP 2 -> Success
      const reachable2 = Pathfinding.getReachableHexes(
        start,
        2,
        map,
        zocContext
      );
      expect(reachable2.has(zocHexId)).toBe(true);
    });
  });
});
