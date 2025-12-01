import { TERRAIN_MP_COSTS } from "../data";
import { Hex } from "../models/hex";
import { HexCoords } from "../types/geometry";
import { HexUtils } from "./hex-utils";
import { MapUtils } from "./map-utils";

interface ZocContext {
  playerId: string;
  zocMap: Map<string, Set<string>>; // Key: Hex ID, Value: Set of Player IDs that exert ZOC into this hex.
}

export const Pathfinding = {
  // TODO: Not sure if we need this shortest path function since players will likely
  // construct their own path (using `getReachableHexes`). Players will
  // want to avoid crashes with other units and therefore shortest path may not always be desired.

  /**
   * A* Algorithm for Unit Movement.
   * Calculates the specific path from A to B.
   */
  findPath(
    start: HexCoords,
    end: HexCoords,
    hexLookup: Map<string, Hex>,
    maxMP: number | null,
    context?: ZocContext // Optional: If provided, applies ZOC penalties
  ): HexCoords[] | null {
    const startKey = HexUtils.getID(start);
    const endKey = HexUtils.getID(end);

    const openSet: { coord: HexCoords; f: number }[] = [{ coord: start, f: 0 }];
    const cameFrom = new Map<string, HexCoords>();
    const gScore = new Map<string, number>();
    gScore.set(startKey, 0);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!.coord;
      const currentKey = HexUtils.getID(current);

      if (currentKey === endKey) {
        return reconstructPath(cameFrom, current);
      }

      for (const neighbor of HexUtils.neighbors(current)) {
        const neighborKey = HexUtils.getID(neighbor);
        const neighborHex = hexLookup.get(neighborKey);

        if (!neighborHex || neighborHex.isImpassable) continue;

        // 1. Calculate Base Cost
        let moveCost = TERRAIN_MP_COSTS[neighborHex.terrain] || 1;

        // 2. Apply ZOC Multiplier (If context exists)
        if (context) {
          const isZOC = MapUtils.isHexInEnemyZOC(
            neighborKey,
            context.playerId,
            context.zocMap
          );

          if (isZOC) {
            moveCost *= 2; // Double Cost Rule
          }
        }

        const tentativeG = (gScore.get(currentKey) || 0) + moveCost;

        // 3. Check MP Budget
        if (maxMP != null && tentativeG > maxMP) continue;

        if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          const f = tentativeG + HexUtils.distance(neighbor, end);

          if (!openSet.some((n) => HexUtils.equals(n.coord, neighbor))) {
            openSet.push({ coord: neighbor, f });
          }
        }
      }
    }

    return null;
  },

  /**
   * Dijkstra / Flood Fill.
   * Finds ALL hexes reachable within a certain cost.
   * Used for: Supply Network (No ZOC context) AND Unit Movement Range UI (With ZOC context).
   */
  getReachableHexes(
    start: HexCoords,
    maxCost: number,
    hexMap: Map<string, Hex>,
    zocContext?: ZocContext // Optional: If provided, applies ZOC penalties
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

      const neighbors = HexUtils.neighbors(current.coord);

      for (const neighbor of neighbors) {
        const neighborId = HexUtils.getID(neighbor);
        const hexData = hexMap.get(neighborId);

        // 1. Check if hex exists and is passable
        if (!hexData || hexData.isImpassable) continue;

        // 2. Calculate Cost
        let moveCost = TERRAIN_MP_COSTS[hexData.terrain] || 1;

        // 3. Apply ZOC Multiplier (If context exists)
        if (zocContext) {
          const isZOC = MapUtils.isHexInEnemyZOC(
            neighborId,
            zocContext.playerId,
            zocContext.zocMap
          );
          
          if (isZOC) {
            moveCost *= 2; // Double Cost Rule
          }
        }

        const newCost = current.cost + moveCost;

        // 4. Check Budget
        if (newCost > maxCost) continue;

        // 5. Check if we found a cheaper path to this hex
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
