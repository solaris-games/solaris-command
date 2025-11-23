import { Hex } from '../models/hex';
import { HexCoord } from '../types/geometry';
import { HexUtils } from './hex-utils';
import { TerrainType } from '../types';

// Cost definition for A*
const TERRAIN_COSTS: Record<TerrainType, number> = {
  [TerrainType.EMPTY]: 1,
  [TerrainType.ASTEROID_FIELD]: 2,
  [TerrainType.DEBRIS_FIELD]: 2,
  [TerrainType.NEBULA]: 3,
  [TerrainType.GAS_CLOUD]: 3,
  [TerrainType.INDUSTRIAL_ZONE]: 3,
  [TerrainType.GRAVITY_WELL]: 999, // Impassable
  [TerrainType.RADIATION_STORM]: 999
};

export const Pathfinding = {
  /**
   * A* Algorithm for Unit Movement
   */
  findPath(
    start: HexCoord,
    end: HexCoord,
    mapHexes: Map<string, Hex>, // Fast lookup map
    maxMP: number | null // Optional: Pass null if we want path regardless of MP
  ): HexCoord[] | null {
    
    const startKey = HexUtils.getID(start);
    const endKey = HexUtils.getID(end);

    // Open Set: Nodes to be evaluated
    const openSet: { coord: HexCoord; f: number }[] = [{ coord: start, f: 0 }];
    
    // Came From: For reconstructing the path
    const cameFrom = new Map<string, HexCoord>();
    
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
        const moveCost = TERRAIN_COSTS[neighborHex.terrain] || 1;
        const tentativeG = (gScore.get(currentKey) || 0) + moveCost;

        // 4. Check if path is better
        if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
          // Check Max MP constraints if we just want path regardless of MP
          if (maxMP != null && tentativeG > maxMP) continue; 

          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          
          // Heuristic: Manhattan distance to end
          const f = tentativeG + HexUtils.distance(neighbor, end);
          
          if (!openSet.some(n => HexUtils.equals(n.coord, neighbor))) {
            openSet.push({ coord: neighbor, f });
          }
        }
      }
    }

    return null; // No path found
  }
};

function reconstructPath(cameFrom: Map<string, HexCoord>, current: HexCoord): HexCoord[] {
  const totalPath = [current];
  let currKey = HexUtils.getID(current);
  
  while (cameFrom.has(currKey)) {
    const prev = cameFrom.get(currKey)!;
    totalPath.unshift(prev);
    currKey = HexUtils.getID(prev);
  }
  return totalPath; // Includes start node
}