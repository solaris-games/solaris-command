import { Hex, TerrainTypes } from "../models";
import { HexCoords } from "../types";
import { HexUtils } from "./hex-utils";
import { TERRAIN_MP_COSTS } from "../data";

export const Pathfinding = {
  /**
   * A* Algorithm for Unit Movement
   */
  findPath(
    start: HexCoords,
    end: HexCoords,
    mapHexes: Map<string, Hex>, // Fast lookup map
    maxMP: number | null // Optional: Pass null if we want path regardless of MP
  ): HexCoords[] | null {
    const startKey = HexUtils.getID(start);
    const endKey = HexUtils.getID(end);

    // Open Set: Nodes to be evaluated
    const openSet: { coord: HexCoords; f: number }[] = [{ coord: start, f: 0 }];

    // Came From: For reconstructing the path
    const cameFrom = new Map<string, HexCoords>();

    // G Score: Cost from start to node
    const gScore = new Map<string, number>();
    gScore.set(startKey, 0);

    while (openSet.length > 0) {
      // Sort by lowest F score (should use PriorityQueue in prod)
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!.coord;
      const currentKey = HexUtils.getID(current);

      if (currentKey === endKey) {
        return reconstructPath(cameFrom, current);
      }

      // Explore neighbors
      for (const neighbor of HexUtils.neighbors(current)) {
        const neighborKey = HexUtils.getID(neighbor);
        const neighborHex = mapHexes.get(neighborKey);

        // 1. Validation: Is hex on map?
        if (!neighborHex) continue;

        // 2. Validation: Is impassable?
        if (neighborHex.isImpassable) continue;

        // 3. Calculate Cost
        const moveCost = TERRAIN_MP_COSTS[neighborHex.terrain] || 1;
        const tentativeG = (gScore.get(currentKey) || 0) + moveCost;

        // 4. Check if path is better
        if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
          // Check Max MP constraints if applicable, if not then we'll just get the
          // path regardless of MP restrictions.
          if (maxMP != null && tentativeG > maxMP) continue;

          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);

          // Heuristic: Manhattan distance to end
          const f = tentativeG + HexUtils.distance(neighbor, end);

          if (!openSet.some((n) => HexUtils.equals(n.coord, neighbor))) {
            openSet.push({ coord: neighbor, f });
          }
        }
      }
    }

    return null; // No path found
  },
};

function reconstructPath(
  cameFrom: Map<string, HexCoords>,
  current: HexCoords
): HexCoords[] {
  const totalPath = [current];
  let currKey = HexUtils.getID(current);

  while (cameFrom.has(currKey)) {
    const prev = cameFrom.get(currKey)!;
    totalPath.unshift(prev);
    currKey = HexUtils.getID(prev);
  }
  return totalPath; // Includes start node
}
