import { ObjectId } from 'mongodb';
import { HexUtils } from './hex-utils'
import { Planet } from '../models/planet';
import { Station, StationStatuses } from '../models/station';
import { Unit } from '../models/unit';
import { Map as GameMap } from '../models/map'; // Renamed to avoid conflict with JS Map

export const SupplyEngine = {
  /**
   * Calculates the entire set of hexes that are "In Supply" for a given player.
   * Uses BFS to ensure stations are only active if connected to a Root (Planet).
   */
  calculatePlayerSupplyNetwork(playerId: ObjectId, map: GameMap): Set<string> {
    const suppliedHexIds = new Set<string>();
    
    // 1. Identify Sources
    // Roots: Always produce supply (Capital Planets)
    const playerCapitalPlanets = map.planets.filter(p => p.isCapital && String(p.playerId) === String(playerId));
    
    // Potential Relays: Stations (Must be ACTIVE to participate)
    const playerStations = map.stations.filter(s => 
      String(s.playerId) === String(playerId) && 
      s.status === StationStatuses.ACTIVE
    );

    // Queue for Breadth-First Search (BFS)
    // We start propagation from the Roots.
    const sourceQueue: Array<{ location: any; range: number }> = [];
    const visitedStations = new Set<string>(); // Keep track of stations we've already activated

    // 2. Initialize with Roots (Planets)
    playerCapitalPlanets.forEach(planet => {
      sourceQueue.push({
        location: planet.location,
        range: planet.supply.supplyLevel // Assuming supplyLevel = Radius in hexes
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
      for (const station of playerStations) {
        const stationId = station._id.toString();
        
        if (visitedStations.has(stationId)) continue; // Already powered

        // Check if this station sits inside the hexes we just supplied
        const stationHexId = HexUtils.getID(station.location);
        
        if (suppliedHexIds.has(stationHexId)) {
          // BOOM! Connection established. 
          // This station is now powered and acts as a new source.
          visitedStations.add(stationId);
          sourceQueue.push({
            location: station.location,
            range: station.supply.supplyLevel
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
      // In Supply: Reset bad counters
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