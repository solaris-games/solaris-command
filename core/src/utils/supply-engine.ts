import { Planet, Station, Unit } from "../models";
import { Hex } from "../models/hex"; // Assuming Hex model exports TerrainTypes
import { HexUtils } from "./hex-utils";
import { HexCoords, HexCoordsId } from "../types/geometry";
import { Pathfinding } from "./pathfinding";
import { CONSTANTS } from "../data";
import { SupplyTarget, UnifiedId } from "../types";

export const SupplyEngine = {
  /**
   * Calculates the entire set of hexes that are "In Supply" for a given player.
   * Uses Dijkstra/Flood Fill to trace supply lines based on MP costs.
   */
  calculatePlayerSupplyNetwork(
    playerId: UnifiedId,
    hexes: Hex[],
    planets: Planet[],
    stations: Station[]
  ): Set<HexCoordsId> {
    const suppliedHexIds = new Set<HexCoordsId>();

    // Optimization: Create a Map for O(1) Hex Lookup by ID
    const playerHexMap = new Map<HexCoordsId, Hex>();
    hexes
      .filter((h) => h.playerId && String(h.playerId) === String(playerId)) // Supply only applies to player owned hexes
      .forEach((h) => playerHexMap.set(HexUtils.getCoordsID(h.location), h));

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
      (s) => String(s.playerId) === String(playerId)
    );

    const nodes: (Planet | Station)[] = [...playerPlanets, ...playerStations];

    // Queue for Supply Propagation
    // We start propagation from the Roots.
    const sourceQueue: Array<{ location: HexCoords; rangeMP: number }> = [];
    const visitedNodes = new Set<string>(); // Keep track of planets/stations we've already activated

    // 2. Initialize with Roots
    rootSources.forEach((planet) => {
      sourceQueue.push({
        location: planet.location,
        rangeMP: CONSTANTS.SUPPLY_RANGE_MP_ROOT,
      });
      visitedNodes.add(String(planet._id));
    });

    // 3. Propagate Supply
    while (sourceQueue.length > 0) {
      const currentSource = sourceQueue.shift()!;

      // A. Calculate reachable hexes using MP Costs (Dijkstra Flood Fill)
      const reachableHexIDs = Pathfinding.getReachableHexes(
        currentSource.location,
        currentSource.rangeMP,
        playerHexMap,
        playerId
      );

      // B. Add to the master list of supplied hexes
      for (const hexId of reachableHexIDs) {
        suppliedHexIds.add(hexId);
      }

      // C. Check if this source activated any "Dark" Stations/Planets
      // (A station is 'Dark' if it hasn't been visited/powered yet)
      for (const node of nodes) {
        const nodeId = String(node._id);

        if (visitedNodes.has(nodeId)) continue; // Already powered

        // Check if this station sits inside the hexes we just supplied
        const hexId = HexUtils.getCoordsID(node.location);

        if (suppliedHexIds.has(hexId)) {
          // BOOM! Connection established.
          // This planet/station is now powered and acts as a new source.
          visitedNodes.add(nodeId);
          sourceQueue.push({
            location: node.location,
            rangeMP: CONSTANTS.SUPPLY_RANGE_MP_NODE,
          });
        }
      }
    }

    return suppliedHexIds;
  },

  /**
   * Updates a supply target's (e.g Unit) status based on the network.
   */
  processSupplyTarget(supply: SupplyTarget, location: HexCoords, suppliedHexIds: Set<HexCoordsId>): SupplyTarget {
    const currentHexId = HexUtils.getCoordsID(location);
    const isSupplied = suppliedHexIds.has(currentHexId);

    let newTicksLastSupply = supply.ticksLastSupply;
    let newTicksOutOfSupply = supply.ticksOutOfSupply;

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
      isInSupply: isSupplied,
      ticksLastSupply: newTicksLastSupply,
      ticksOutOfSupply: newTicksOutOfSupply,
    };
  },

};
