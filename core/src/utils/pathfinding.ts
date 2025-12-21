import { ERROR_CODES, TERRAIN_MP_COSTS } from "../data";
import { Hex } from "../models/hex";
import { UnifiedId } from "../types";
import { HexCoords, HexCoordsId } from "../types/geometry";
import { HexUtils } from "./hex-utils";
import { MapUtils } from "./map-utils";

export const Pathfinding = {
  /**
   * Dijkstra / Flood Fill.
   * Finds ALL hexes reachable within a certain cost.
   * Used for: Supply Network (No ZOC context) AND Unit Movement Range UI (With ZOC context).
   */
  getReachableHexes(
    start: HexCoords,
    maxCost: number,
    hexMap: Map<HexCoordsId, Hex>,
    playerId: UnifiedId | null // If from the perspective of a player
  ): Set<HexCoordsId> {
    const visited = new Map<HexCoordsId, number>(); // HexID -> Cost to reach
    const queue: { coord: HexCoords; cost: number }[] = [];
    const results = new Set<HexCoordsId>();

    const startId = HexUtils.getCoordsID(start);

    // Init
    queue.push({ coord: start, cost: 0 });
    visited.set(startId, 0);
    results.add(startId);

    while (queue.length > 0) {
      // Sort by lowest cost (Simple Priority Queue)
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift()!;

      const neighbors = HexUtils.neighbors(current.coord);

      for (const neighbor of neighbors) {
        const neighborId = HexUtils.getCoordsID(neighbor);
        const hexData = hexMap.get(neighborId);

        // Check if hex exists and is passable
        if (!hexData || MapUtils.isHexImpassable(hexData)) continue;

        // Calculate Cost (Apply ZOC if applicable)
        const mpCost = MapUtils.getHexMPCost(hexData, playerId);

        const newCost = current.cost + mpCost;

        // Check Budget
        if (newCost > maxCost) continue;

        // Check if we found a cheaper path to this hex
        const existingCost = visited.get(neighborId);
        if (existingCost === undefined || newCost < existingCost) {
          visited.set(neighborId, newCost);
          queue.push({ coord: neighbor, cost: newCost });
          results.add(neighborId);
        }
      }
    }

    return results;
  },

  validatePath(
    start: HexCoords,
    path: HexCoords[],
    currentMp: number,
    hexMap: Map<HexCoordsId, Hex>,
    playerId: UnifiedId | null
  ): { valid: boolean; error?: string } {
    let current = start;
    let totalCost = 0;

    for (const step of path) {
      // 1. Check Adjacency
      if (!HexUtils.isNeighbor(current, step)) {
        return {
          valid: false,
          error: ERROR_CODES.MOVEMENT_PATH_INVALID, // Non-adjacent step
        };
      }

      // 2. Get Hex Data
      const stepId = HexUtils.getCoordsID(step);
      const hexData = hexMap.get(stepId);

      if (!hexData) {
        return {
          valid: false,
          error: ERROR_CODES.MOVEMENT_PATH_INVALID, // Hex does not exist in map
        };
      }

      // 3. Check Impassable
      if (MapUtils.isHexImpassable(hexData)) {
        return {
          valid: false,
          error: ERROR_CODES.MOVEMENT_PATH_IMPASSABLE,
        };
      }

      // 4. Calculate Cost
      const moveCost = MapUtils.getHexMPCost(hexData, playerId);

      // Impassable terrain has high cost defined in data, but double check logic
      if (moveCost >= 999) {
        return {
          valid: false,
          error: ERROR_CODES.MOVEMENT_PATH_IMPASSABLE,
        };
      }

      totalCost += moveCost;

      // 5. Check MP Budget
      if (totalCost > currentMp) {
        return {
          valid: false,
          error: ERROR_CODES.MOVEMENT_PATH_TOO_EXPENSIVE,
        };
      }

      // Advance
      current = step;
    }

    return { valid: true };
  },
};
