import { ObjectId } from "mongodb";
import {
  Game,
  GameStates,
  Player,
  Unit,
  Planet,
  Hex,
  Station,
} from "../models";
import { HexUtils } from "./hex-utils";
import { SupplyEngine } from "./supply-engine";
import { UnitManager } from "./unit-manager";

export interface ProcessCycleResult {
  gameUpdates: Partial<Game>;
  playerUpdates: Map<string, Partial<Player>>;
  unitUpdates: Map<string, Partial<Unit>>;
  unitsToRemove: ObjectId[];
  winnerId: ObjectId | null;
}

export const GameManager = {
  /**
   * THE MASTER LOOP
   * This function will be called by a Cron Job / Ticker every time a Cycle completes.
   * It modifies the objects in memory. The caller is responsible for saving them to DB afterwards.
   */
  processCycle(
    game: Game,
    players: Player[],
    hexes: Hex[],
    units: Unit[],
    planets: Planet[],
    stations: Station[]
  ): ProcessCycleResult {
    const unitUpdates = new Map<string, Partial<Unit>>();
    const playerUpdates = new Map<string, Partial<Player>>();
    const unitsToRemove: ObjectId[] = []; // <--- Track dead units

    let winnerId: ObjectId | null = null;

    // 1. Process each Player independently
    players.forEach((player) => {
      const playerIdStr = player._id.toString();

      // --- A. LOGISTICS PHASE ---
      const supplyNetwork = SupplyEngine.calculatePlayerSupplyNetwork(
        player._id,
        hexes,
        planets,
        stations
      );

      const playerUnits = units.filter(
        (u) => u.playerId.toString() === playerIdStr
      );

      playerUnits.forEach((unit) => {
        // 1. Determine Supply Status
        const supplyUpdate = SupplyEngine.processUnitSupply(
          unit,
          supplyNetwork
        );
        const unitWithSupply = { ...unit, ...supplyUpdate } as Unit;

        // 2. Run Cycle Logic (Refill AP/MP, Recovery, or Penalties)
        const cycleUpdate = UnitManager.processCycle(
          unitWithSupply,
          game.settings.ticksPerCycle
        );

        // 3. Check for Death (Starvation/Collapse)
        // We merge the proposed updates to check the resulting steps
        const resultingSteps = cycleUpdate.steps || unit.steps;

        if (resultingSteps.length === 0) {
          // Unit died this cycle
          unitsToRemove.push(unit._id);
        } else {
          // Unit lives, queue update
          unitUpdates.set(unit._id.toString(), {
            ...supplyUpdate,
            ...cycleUpdate,
          });
        }
      });

      // --- B. ECONOMY PHASE ---
      const ownedPlanets = planets.filter(
        (p) => String(p.playerId) === playerIdStr
      );

      // Calculate Prestige Income
      const income = GameManager.calculatePrestigeIncome(ownedPlanets);
      const newPrestige = player.prestigePoints + income;

      // Calculate Victory Points (Accumulated per cycle)
      const vpIncome = GameManager.calculateVPIncome(ownedPlanets);
      const newVP = player.victoryPoints + vpIncome;

      playerUpdates.set(playerIdStr, {
        prestigePoints: newPrestige,
        victoryPoints: newVP,
      });

      // --- C. VICTORY CHECK ---
      if (newVP >= game.settings.victoryPointsToWin) {
        // If multiple players cross the line same tick, highest wins (tie-break logic needed?)
        if (
          !winnerId ||
          newVP > (players.find((p) => p._id === winnerId)?.victoryPoints || 0)
        ) {
          winnerId = player._id;
        }
      }
    });

    // 2. Game State Update
    // Note: We only increment the Cycle count here. The Ticks are incremented by another process.
    const gameUpdates: Partial<Game> = {
      state: {
        ...game.state,
        cycle: game.state.cycle + 1,
        lastTickDate: new Date(),
        winnerPlayerId: winnerId,
      },
    };

    if (winnerId) {
      gameUpdates.state!.status = GameStates.COMPLETED;
      gameUpdates.state!.endDate = new Date();
    }

    return { gameUpdates, playerUpdates, unitUpdates, unitsToRemove, winnerId };
  },

  /**
   * Calculate total Prestige generated this cycle
   */
  calculatePrestigeIncome(ownedPlanets: Planet[]): number {
    return ownedPlanets.reduce(
      (total, planet) => total + planet.prestigePointsPerCycle,
      0
    );
  },

  /**
   * Calculate total VPs generated this cycle
   */
  calculateVPIncome(ownedPlanets: Planet[]): number {
    return ownedPlanets.reduce(
      (total, planet) => total + planet.victoryPointsPerCycle,
      0
    );
  },

  /**
   * Helper: Find a valid spawn location for a new unit
   * Rules: Adjacent to Capital, Empty Hex, No Unit.
   */
  findSpawnLocation(
    playerCapital: Planet,
    mapHexes: Hex[],
    allUnits: Unit[]
  ): any | null {
    // Get all neighbors
    const candidates = HexUtils.neighbors(playerCapital.location);

    // Filter valid
    for (const coord of candidates) {
      const hexId = HexUtils.getID(coord);
      const hex = mapHexes.find((h) => HexUtils.getID(h.coords) === hexId);

      // Must exist and be passable
      if (!hex || hex.isImpassable) continue;

      // Must be empty of units
      const isOccupied = allUnits.some(
        (u) => HexUtils.getID(u.location) === hexId
      );
      if (isOccupied) continue;

      // Found one!
      return coord;
    }

    return null; // Capital is surrounded/blockaded
  },
};
