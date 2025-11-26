import { ObjectId } from "mongodb";
import { Planet, Station, StationStatuses, Unit } from "../models";
import { Hex, TerrainTypes } from "../models/hex"; // Assuming Hex model exports TerrainTypes
import { HexUtils } from "./hex-utils";
import { HexCoords } from "../types/geometry";
import { TERRAIN_MP_COSTS } from "../data";

export const SupplyEngine = {
  /**
   * Calculates the entire set of hexes that are "In Supply" for a given player.
   * Uses Dijkstra/Flood Fill to trace supply lines based on MP costs.
   */
  calculatePlayerSupplyNetwork(
    playerId: ObjectId,
    hexes: Hex[],
    planets: Planet[],
    stations: Station[]
  ): Set<string> {
    const suppliedHexIds = new Set<string>();

    // Optimization: Create a Map for O(1) Hex Lookup by ID
    const hexMap = new Map<string, Hex>();
    hexes.forEach((h) => hexMap.set(HexUtils.getID(h.coords), h));

    // 1. Identify Sources
    // Roots: Always produce supply (Capital Planets)
    const rootSources = planets.filter(
      (p) => p.supply.isRoot && String(p.playerId) === String(playerId)
    );

    // Potential Relays: Planets/Stations (Must be ACTIVE to participate)
    const playerPlanets = planets.filter(
      (p) => String(p.playerId) === String(playerId)
    );
    const playerStations = stations.filter(
      (s) =>
        String(s.playerId) === String(playerId) &&
        s.status === StationStatuses.ACTIVE
    );

    const nodes: (Planet | Station)[] = [...playerPlanets, ...playerStations];

    // Queue for Supply Propagation
    // We start propagation from the Roots.
    const sourceQueue: Array<{ location: HexCoords; range: number }> = [];
    const visitedNodes = new Set<string>(); // Keep track of planets/stations we've already activated

    // 2. Initialize with Roots
    rootSources.forEach((planet) => {
      sourceQueue.push({
        location: planet.location,
        range: planet.supply.supplyRange, // Range in Movement Points
      });
      visitedNodes.add(planet._id.toString());
    });

    // 3. Propagate Supply
    while (sourceQueue.length > 0) {
      const currentSource = sourceQueue.shift()!;

      // A. Calculate reachable hexes using MP Costs (Dijkstra Flood Fill)
      const reachableHexIDs = SupplyEngine.getReachableHexes(
        currentSource.location,
        currentSource.range,
        hexMap
      );

      // B. Add to the master list of supplied hexes
      for (const hexId of reachableHexIDs) {
        suppliedHexIds.add(hexId);
      }

      // C. Check if this source activated any "Dark" Stations/Planets
      // (A station is 'Dark' if it hasn't been visited/powered yet)
      for (const node of nodes) {
        const nodeId = node._id.toString();

        if (visitedNodes.has(nodeId)) continue; // Already powered

        // Check if this station sits inside the hexes we just supplied
        const hexId = HexUtils.getID(node.location);

        if (suppliedHexIds.has(hexId)) {
          // BOOM! Connection established.
          // This planet/station is now powered and acts as a new source.
          visitedNodes.add(nodeId);
          sourceQueue.push({
            location: node.location,
            range: node.supply.supplyRange,
          });
        }
      }
    }

    return suppliedHexIds;
  },

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

  /**
   * Updates a Unit's supply status based on the network.
   * Returns the partial update object to save to DB.
   */
  processUnitSupply(unit: Unit, suppliedHexIds: Set<string>): Partial<Unit> {
    const currentHexId = HexUtils.getID(unit.location);
    const isSupplied = suppliedHexIds.has(currentHexId);

    let newTicksLastSupply = unit.supply.ticksLastSupply;
    let newTicksOutOfSupply = unit.supply.ticksOutOfSupply;

    if (isSupplied) {
      // In Supply: Reset counters
      newTicksLastSupply = 0;
      newTicksOutOfSupply = 0;
    } else {
      // Out of Supply: Increment counters
      newTicksLastSupply += 1;
      newTicksOutOfSupply += 1;
    }

    return {
      supply: {
        ...unit.supply,
        isInSupply: isSupplied,
        ticksLastSupply: newTicksLastSupply,
        ticksOutOfSupply: newTicksOutOfSupply,
      },
    };
  },

  /**
   * Helper: Check if a specific hex is in supply (for UI overlays)
   */
  isHexSupplied(hexId: string, network: Set<string>): boolean {
    return network.has(hexId);
  },
};
