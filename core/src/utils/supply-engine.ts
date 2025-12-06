import { ObjectId } from "mongodb";
import { Planet, Station, StationStatus, Unit } from "../models";
import { Hex } from "../models/hex"; // Assuming Hex model exports TerrainTypes
import { HexUtils } from "./hex-utils";
import { HexCoords } from "../types/geometry";
import { Pathfinding } from "./pathfinding";
import { MapUtils } from "./map-utils";
import { CONSTANTS } from "../data";

export const SupplyEngine = {
  /**
   * Calculates the entire set of hexes that are "In Supply" for a given player.
   * Uses Dijkstra/Flood Fill to trace supply lines based on MP costs.
   */
  calculatePlayerSupplyNetwork(
    playerId: ObjectId,
    hexes: Hex[],
    planets: Planet[],
    stations: Station[],
    units: Unit[]
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
        s.status === StationStatus.ACTIVE
    );

    const zocMap = MapUtils.calculateZOCMap(units);

    const nodes: (Planet | Station)[] = [...playerPlanets, ...playerStations];

    // Queue for Supply Propagation
    // We start propagation from the Roots.
    const sourceQueue: Array<{ location: HexCoords; rangeMP: number }> = [];
    const visitedNodes = new Set<string>(); // Keep track of planets/stations we've already activated

    // 2. Initialize with Roots
    rootSources.forEach((planet) => {
      sourceQueue.push({
        location: planet.location,
        rangeMP: CONSTANTS.ROOT_SUPPLY_RANGE_MP,
      });
      visitedNodes.add(planet._id.toString());
    });

    // 3. Propagate Supply
    while (sourceQueue.length > 0) {
      const currentSource = sourceQueue.shift()!;

      // A. Calculate reachable hexes using MP Costs (Dijkstra Flood Fill)
      const reachableHexIDs = Pathfinding.getReachableHexes(
        currentSource.location,
        currentSource.rangeMP,
        hexMap,
        {
          playerId: String(playerId),
          zocMap,
        }
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
            rangeMP: CONSTANTS.NODE_SUPPLY_RANGE_MP,
          });
        }
      }
    }

    return suppliedHexIds;
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
