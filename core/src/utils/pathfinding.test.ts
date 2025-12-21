import { describe, it, expect } from "vitest";
import { Pathfinding } from "./pathfinding";
import { Hex, TerrainTypes } from "../models/hex";
import { HexCoords, HexCoordsId } from "../types/geometry";
import { HexUtils } from "./hex-utils";
import { MockUnifiedId } from "../types";

// --- HELPER: Create a map of hexes ---
function createMap(
  width: number,
  height: number,
  terrainOverride: Map<HexCoordsId, TerrainTypes> = new Map()
): Map<HexCoordsId, Hex> {
  const map = new Map<HexCoordsId, Hex>();
  const gameId = new MockUnifiedId();

  for (let q = -width; q <= width; q++) {
    for (let r = -height; r <= height; r++) {
      const s = -q - r;
      const coords = { q, r, s };
      const id = HexUtils.getCoordsID(coords);

      map.set(id, {
        _id: new MockUnifiedId(),
        planetId: null,
        stationId: null,
        gameId: gameId,
        unitId: null,
        playerId: null,
        location: coords,
        terrain: terrainOverride.get(id) || TerrainTypes.EMPTY,
        zoc: []
      });
    }
  }
  return map;
}

describe("Pathfinding", () => {
  describe("getReachableHexes (Flood Fill)", () => {
    const start: HexCoords = { q: 0, r: 0, s: 0 };

    it("should return correct hexes for MP 1 (Neighbors)", () => {
      const map = createMap(3, 3);
      const reachable = Pathfinding.getReachableHexes(start, 1, map, null);

      // Center (0 cost) + 6 Neighbors (1 cost)
      expect(reachable.size).toBe(7);
      expect(reachable.has(HexUtils.getCoordsID(start))).toBe(true);
      expect(reachable.has("1,0,-1")).toBe(true);
    });

    it("should be blocked by Impassable terrain", () => {
      const map = createMap(3, 3);
      const neighborId = "1,0,-1";
      map.get(neighborId)!.terrain = TerrainTypes.RADIATION_STORM;

      const reachable = Pathfinding.getReachableHexes(start, 1, map, null);

      expect(reachable.has(neighborId)).toBe(false);
      expect(reachable.size).toBe(6); // Center + 5 neighbors
    });

    it("should cost more for difficult terrain", () => {
      const map = createMap(3, 3);
      const asteroidId = "1,0,-1"; // Cost 2
      map.get(asteroidId)!.terrain = TerrainTypes.ASTEROID_FIELD;

      // With 1 MP, cannot enter Asteroid field
      const reachable1 = Pathfinding.getReachableHexes(start, 1, map, null);
      expect(reachable1.has(asteroidId)).toBe(false);

      // With 2 MP, can enter
      const reachable2 = Pathfinding.getReachableHexes(start, 2, map, null);
      expect(reachable2.has(asteroidId)).toBe(true);
    });

    it("should double cost for ZOC", () => {
      const map = createMap(3, 3);
      const ZOCHexId = "1,0,-1"; // Base Cost 1

      const playerId = new MockUnifiedId()
      const enemyPlayerId = new MockUnifiedId()

      map.get(ZOCHexId)!.zoc.push({
        playerId: enemyPlayerId,
        unitId: new MockUnifiedId()
      })

      // With ZOC, cost becomes 2.
      // MP 1 -> Fail
      const reachable1 = Pathfinding.getReachableHexes(
        start,
        1,
        map,
        playerId
      );
      expect(reachable1.has(ZOCHexId)).toBe(false);

      // MP 2 -> Success
      const reachable2 = Pathfinding.getReachableHexes(
        start,
        2,
        map,
        playerId
      );
      expect(reachable2.has(ZOCHexId)).toBe(true);
    });
  });

  describe("validatePath", () => {
    const start: HexCoords = { q: 0, r: 0, s: 0 };
    // Neighbors: (1,0,-1), (1,-1,0), (0,-1,1), (-1,0,1), (-1,1,0), (0,1,-1)

    it("should return valid for a simple neighbor move with sufficient MP", () => {
      const map = createMap(3, 3);
      const path: HexCoords[] = [{ q: 1, r: 0, s: -1 }]; // 1 hex away
      const currentMp = 1;

      const result = Pathfinding.validatePath(start, path, currentMp, map);
      expect(result.valid).toBe(true);
    });

    it("should return valid for a multi-step path with sufficient MP", () => {
      const map = createMap(3, 3);
      // Path: (0,0,0) -> (1,0,-1) -> (2,0,-2)
      const path: HexCoords[] = [
        { q: 1, r: 0, s: -1 },
        { q: 2, r: 0, s: -2 },
      ];
      const currentMp = 2;

      const result = Pathfinding.validatePath(start, path, currentMp, map);
      expect(result.valid).toBe(true);
    });

    it("should fail if path is not adjacent (skipping steps)", () => {
      const map = createMap(3, 3);
      // Path: (0,0,0) -> (2,0,-2) [Skipped (1,0,-1)]
      const path: HexCoords[] = [{ q: 2, r: 0, s: -2 }];
      const currentMp = 10;

      const result = Pathfinding.validatePath(start, path, currentMp, map);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("MOVEMENT_PATH_INVALID");
    });

    it("should fail if hex is not on the map", () => {
      const map = createMap(3, 3); // Max range 3
      const path: HexCoords[] = [{ q: 10, r: 0, s: -10 }]; // Out of bounds
      const currentMp = 10;

      // Even if adjacency math allowed it (it doesn't here, but logic checks map existence)
      // Actually adjacency fails first here. Let's make it adjacent but off map?
      // createMap(0,0) -> only 0,0,0. Neighbor is off map.
      const tinyMap = createMap(0, 0);
      const path2: HexCoords[] = [{ q: 1, r: 0, s: -1 }];

      const result = Pathfinding.validatePath(start, path2, currentMp, tinyMap);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("MOVEMENT_PATH_INVALID");
    });

    it("should fail if MP is insufficient", () => {
      const map = createMap(3, 3);
      const path: HexCoords[] = [
        { q: 1, r: 0, s: -1 }, // Cost 1
        { q: 2, r: 0, s: -2 }, // Cost 1
      ];
      // Total Cost 2. MP 1.
      const currentMp = 1;

      const result = Pathfinding.validatePath(start, path, currentMp, map);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("MOVEMENT_PATH_TOO_EXPENSIVE");
    });

    it("should calculate variable terrain costs correctly", () => {
      const map = createMap(3, 3);
      const difficultHexId = "1,0,-1";
      map.get(difficultHexId)!.terrain = TerrainTypes.ASTEROID_FIELD; // Cost 2

      const path: HexCoords[] = [{ q: 1, r: 0, s: -1 }];

      // Cost 2. MP 1 -> Fail
      expect(Pathfinding.validatePath(start, path, 1, map).valid).toBe(false);

      // Cost 2. MP 2 -> Pass
      expect(Pathfinding.validatePath(start, path, 2, map).valid).toBe(true);
    });

    it("should fail if path includes impassable terrain", () => {
      const map = createMap(3, 3);
      const wallHexId = "1,0,-1";
      map.get(wallHexId)!.terrain = TerrainTypes.GRAVITY_WELL; // Impassable

      const path: HexCoords[] = [{ q: 1, r: 0, s: -1 }];
      const currentMp = 9999; // Even with infinite MP

      const result = Pathfinding.validatePath(start, path, currentMp, map);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("MOVEMENT_PATH_IMPASSABLE");
    });
  });
});
