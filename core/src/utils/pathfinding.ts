import { Hex, TerrainTypes } from "../models";
import { HexCoords } from "../types";
import { HexUtils } from "./hex-utils";
import { TERRAIN_MP_COSTS } from "../data";

export const Pathfinding = {
  /**
   * Helper: Perform a Flood Fill / Dijkstra to find all hexes within MP range.
   */
  getReachableHexes(
    start: HexCoords,
    maxMP: number,
    hexMap: Map<string, Hex>
  ): Set<string> {
    const visited = new Map<string, number>(); // HexID -> Cost to reach
    const queue: { coord: HexCoords; cost: number }[] = [];
    const results = new Set<string>();

    const startId = HexUtils.getID(start);

    // Init
    queue.push({ coord: start, cost: 0 });
    visited.set(startId, 0);
    results.add(startId);

    while (queue.length > 0) {
      // Sort by lowest cost (Simple Priority Queue)
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift()!;

      // Explore Neighbors
      const neighbors = HexUtils.neighbors(current.coord);

      for (const neighbor of neighbors) {
        const neighborId = HexUtils.getID(neighbor);
        const hexData = hexMap.get(neighborId);

        // 1. Check if hex exists and is passable
        if (!hexData || hexData.isImpassable) continue;

        // 2. Calculate Cost
        // Defaults to 1 if terrain type missing
        const moveCost = TERRAIN_MP_COSTS[hexData.terrain] || 1;
        const newCost = current.cost + moveCost;

        // 3. Check Budget
        if (newCost > maxMP) continue;

        // 4. Check if we found a cheaper path to this hex
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
};
