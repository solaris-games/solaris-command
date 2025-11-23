import { ObjectId } from 'mongodb';
import { HexUtils } from './hex-utils'
import { Planet } from '../models/planet';
import { Station, StationStatuses } from '../models/station';
import { Unit } from '../models/unit';
import { GameMap as GameMap } from '../models/game-map'; // Renamed to avoid conflict with JS Map

export const SupplyEngine = {
  /**
   * Calculates the entire set of hexes that are "In Supply" for a given player.
   * Uses BFS to ensure stations are only active if connected to a Root (Planet).
   */
  calculatePlayerSupplyNetwork(playerId: ObjectId, planets: Planet[], stations: Station[]): Set<string> {
    const suppliedHexIds = new Set<string>();
    
    // 1. Identify Sources
    // Roots: Always produce supply (Capital Planets)
    const rootSources = planets.filter(p => p.supply.isRoot && String(p.playerId) === String(playerId));
    
    // Potential Relays: Planets/Stations (Must be ACTIVE to participate)
    const playerPlanets = planets.filter(p => String(p.playerId) === String(playerId))
    const playerStations = stations.filter(s => String(s.playerId) === String(playerId) && s.status === StationStatuses.ACTIVE);

    const nodes: (Planet | Station)[] = [
        ...playerPlanets,
        ...playerStations
    ]

    // Queue for Breadth-First Search (BFS)
    // We start propagation from the Roots.
    const sourceQueue: Array<{ location: any; range: number }> = [];
    const visited = new Set<string>(); // Keep track of planets/stations we've already activated

    // 2. Initialize with Roots (Planets)
    rootSources.forEach(planet => {
      sourceQueue.push({
        location: planet.location,
        range: planet.supply.supplyRange // TODO: This is movement points, not hex radius.
      });
    });

    // 3. Propagate Supply
    while (sourceQueue.length > 0) {
      const currentSource = sourceQueue.shift()!;
      
      // A. Calculate hexes covered by this source
      const coveredHexes = HexUtils.getHexesInRange(currentSource.location, currentSource.range);
      
      // B. Add to the master list of supplied hexes
      for (const hex of coveredHexes) {
        const hexId = HexUtils.getID(hex);
        suppliedHexIds.add(hexId);
      }

      // C. Check if this source activated any "Dark" Stations
      // (A station is 'Dark' if it hasn't been visited/powered yet)
      for (const node of nodes) {
        const nodeId = node._id.toString();
        
        if (visited.has(nodeId)) continue; // Already powered

        // Check if this station sits inside the hexes we just supplied
        const hexId = HexUtils.getID(node.location);
        
        if (suppliedHexIds.has(hexId)) {
          // BOOM! Connection established. 
          // This planet/station is now powered and acts as a new source.
          visited.add(nodeId);
          sourceQueue.push({
            location: node.location,
            range: node.supply.supplyRange
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
        ticksOutOfSupply: newTicksOutOfSupply
      }
    };
  },

  /**
   * Helper: Check if a specific hex is in supply (for UI overlays)
   */
  isHexSupplied(hexId: string, network: Set<string>): boolean {
    return network.has(hexId);
  }
};