import { ObjectId } from 'mongodb';
import { Game, GameStates } from '../models/game';
import { Map as GameMap } from '../models/map';
import { Player } from '../models/player';
import { Unit } from '../models/unit';
import { Planet } from '../models/planet';
import { HexUtils } from './hex-utils';
import { SupplyEngine } from './supply-engine';
import { UnitManager } from './unit-manager';

export const GameManager = {
  
  // TODO: Process tick

  /**
   * THE MASTER LOOP
   * This function will be called by a Cron Job / Ticker every time a Cycle completes.
   * It modifies the objects in memory. The caller is responsible for saving them to DB afterwards.
   */
  processCycle(game: Game, map: GameMap, players: Player[], units: Unit[]): {
    gameUpdates: Partial<Game>,
    playerUpdates: Map<string, Partial<Player>>,
    unitUpdates: Map<string, Partial<Unit>>,
    winnerId: ObjectId | null
  } {
    const unitUpdates = new Map<string, Partial<Unit>>();
    const playerUpdates = new Map<string, Partial<Player>>();
    
    let winnerId: ObjectId | null = null;

    // 1. Process each Player independently
    players.forEach(player => {
      const playerIdStr = player._id.toString();
      
      // --- A. LOGISTICS PHASE ---
      // Calculate Supply Network
      const supplyNetwork = SupplyEngine.calculatePlayerSupplyNetwork(player._id, map);
      
      // Get this player's units
      const playerUnits = units.filter(u => u.playerId.toString() === playerIdStr);
      
      playerUnits.forEach(unit => {
        // 1. Determine Supply Status
        const supplyUpdate = SupplyEngine.processUnitSupply(unit, supplyNetwork);
        const unitWithSupply = { ...unit, ...supplyUpdate } as Unit;

        // 2. Run Cycle Logic (Refill AP/MP, Recovery, or Penalties)
        const cycleUpdate = UnitManager.processCycle(unitWithSupply, game.settings.ticksPerCycle);
        
        // Merge updates
        unitUpdates.set(unit._id.toString(), { ...supplyUpdate, ...cycleUpdate });
      });

      // TODO: Delete units that no longer have any steps.

      // --- B. ECONOMY PHASE ---
      const ownedPlanets = map.planets.filter(p => String(p.playerId) === playerIdStr);
      
      // Calculate Prestige Income
      const income = GameManager.calculatePrestigeIncome(ownedPlanets);
      const newPrestige = player.prestigePoints + income;
      
      // Calculate Victory Points (Accumulated per cycle)
      const vpIncome = GameManager.calculateVPIncome(ownedPlanets);
      const newVP = player.victoryPoints + vpIncome;

      playerUpdates.set(playerIdStr, {
        prestigePoints: newPrestige,
        victoryPoints: newVP
      });

      // --- C. VICTORY CHECK ---
      if (newVP >= game.settings.victoryPointsToWin) {
        // If multiple players cross the line same tick, highest wins (tie-break logic needed?)
        if (!winnerId || newVP > (players.find(p => p._id === winnerId)?.victoryPoints || 0)) {
          winnerId = player._id;
        }
      }
    });

    // 2. Game State Update
    const gameUpdates: Partial<Game> = {
      state: {
        ...game.state,
        cycle: game.state.cycle + 1, // TODO: Is this right? Shouldn't it be ticks + 1? Then recalc cycle count?
        lastTickDate: new Date(),
        winnerPlayerId: winnerId
      }
    };

    if (winnerId) {
      gameUpdates.state!.status = GameStates.COMPLETED;
      gameUpdates.state!.endDate = new Date();
    }

    return { gameUpdates, playerUpdates, unitUpdates, winnerId };
  },

  /**
   * Calculate total Prestige generated this cycle
   */
  calculatePrestigeIncome(ownedPlanets: Planet[]): number {
    return ownedPlanets.reduce((total, planet) => total + planet.prestigePointsPerCycle, 0);
  },

  /**
   * Calculate total VPs generated this cycle
   */
  calculateVPIncome(ownedPlanets: Planet[]): number {
    return ownedPlanets.reduce((total, planet) => total + planet.victoryPointsPerCycle, 0);
  },

  /**
   * Helper: Find a valid spawn location for a new unit
   * Rules: Adjacent to Capital, Empty Hex, No Unit.
   */
  findSpawnLocation(playerCapital: Planet, map: GameMap, allUnits: Unit[]): any | null {
    // Get all neighbors
    const candidates = HexUtils.neighbors(playerCapital.location);
    
    // Filter valid
    for (const coord of candidates) {
      const hexId = HexUtils.getID(coord);
      const hex = map.hexes.find(h => HexUtils.getID(h.coords) === hexId);
      
      // Must exist and be passable
      if (!hex || hex.isImpassable) continue;

      // Must be empty of units
      const isOccupied = allUnits.some(u => HexUtils.getID(u.location) === hexId);
      if (isOccupied) continue;

      // Found one!
      return coord;
    }

    return null; // Capital is surrounded/blockaded
  }
};