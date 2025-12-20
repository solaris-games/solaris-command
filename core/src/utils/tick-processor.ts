import { ObjectId } from "mongodb";
import { CONSTANTS, UNIT_CATALOG_ID_MAP } from "../data";
import {
  Game,
  Unit,
  UnitStatus,
  Hex,
  Planet,
  Station,
  Player,
  GameStates,
  PlayerStatus,
  GameState,
} from "../models";
import { CombatReport, HexCoords, HexCoordsId } from "../types";
import { CombatEngine } from "./combat-engine";
import { HexUtils } from "./hex-utils";
import { UnitManager } from "./unit-manager";
import { SupplyEngine } from "./supply-engine";
import { MapUtils } from "./map-utils";

// TODO: Split these into two files, tick-processor.ts and tick-cycle-processor.ts
// This will make it more manageable to write unit tests for.

export class TickContextHexUpdateTracker {
  // This keeps track of hexes that require updates.
  // At the start of the tick we will capture hexes adjacent to every entity in the game
  // and then after the tick has processed, we'll update this list with any new hexes
  // that will have been updated by unit movement, combat, stations being destroyed etc.
  // This is so that we can update only the hexes that need to be changed in the DB instead
  // of updating every single hex.

  hexesToUpdate: Set<HexCoordsId> = new Set<HexCoordsId>();

  refreshHexesToUpdate(planets: Planet[], stations: Station[], units: Unit[]) {
    const appendLocationHexes = (coords: HexCoords) => {
      const neighbors = HexUtils.neighbors(coords).concat([coords]);

      neighbors.forEach((c) => this.hexesToUpdate.add(HexUtils.getCoordsID(c)));
    };

    // Iterate over all entities and add their current locations to the hex update list.
    planets.forEach((u) => appendLocationHexes(u.location));
    stations.forEach((u) => appendLocationHexes(u.location));
    units.forEach((u) => appendLocationHexes(u.location));
  }
}

export interface ProcessTickResult {
  // Note: Unit updates are not present here since units are ALWAYS updated every tick. We do not need to keep track of individual unit updates.

  gameStateUpdates: Partial<GameState> | null;
  planetUpdates: Map<string, Partial<Planet>>; // Capture updates
  combatReports: CombatReport[]; // Logs for the UI
  unitsToRemove: ObjectId[]; // Dead units to delete
  stationsToRemove: ObjectId[]; // Captured stations to delete
}

export class TickContext {
  newTick: number;
  game: Game;
  players: Player[];
  hexes: Hex[];
  units: Unit[];
  planets: Planet[];
  stations: Station[];

  // --- WORKING SETS (In-Memory State) ---
  // We track unit locations in a Map for O(1) lookup during collision/combat checks.
  // This map is updated continuously as the Tick progresses (e.g., after a Blitz move).
  hexLookup = new Map<HexCoordsId, Hex>();
  unitLocations = new Map<HexCoordsId, Unit>();
  planetLookup = new Map<HexCoordsId, Planet>();
  stationLookup = new Map<HexCoordsId, Station>();

  // --- OUTPUT CONTAINERS ---
  gameStateUpdates: Partial<GameState> | null = null;
  planetUpdates = new Map<string, Partial<Planet>>();
  combatReports: CombatReport[] = [];
  unitsToRemove: ObjectId[] = [];
  stationsToRemove: ObjectId[] = [];

  constructor(
    newTick: number,
    game: Game,
    players: Player[],
    hexes: Hex[],
    units: Unit[],
    planets: Planet[],
    stations: Station[]
  ) {
    this.newTick = newTick;
    this.game = game;
    this.players = players;
    this.hexes = hexes;
    this.units = units;
    this.planets = planets;
    this.stations = stations;

    // We track unit locations in a Map for O(1) lookup during collision/combat checks.
    // This map is updated continuously as the Tick progresses (e.g., after a Blitz move).
    this.hexLookup = new Map<string, Hex>();
    hexes.forEach((h) =>
      this.hexLookup.set(HexUtils.getCoordsID(h.location), h)
    );

    this.unitLocations = new Map<string, Unit>();
    units.forEach((u) =>
      this.unitLocations.set(HexUtils.getCoordsID(u.location), u)
    );

    // Lookup map for Planets to check for capture logic efficiently
    this.planetLookup = new Map<string, Planet>();
    planets.forEach((p) =>
      this.planetLookup.set(HexUtils.getCoordsID(p.location), p)
    );

    this.stationLookup = new Map<string, Station>();
    stations.forEach((s) =>
      this.stationLookup.set(HexUtils.getCoordsID(s.location), s)
    );
  }

  appendPlanetUpdate(planetId: ObjectId, update: Partial<Planet>) {
    const existing = this.planetUpdates.get(String(planetId)) || {};

    this.planetUpdates.set(String(planetId), {
      ...existing,
      ...update,
    });
  }
}

export interface ProcessCycleResult {
  // Note: Unit updates are not present here since units are ALWAYS updated every tick. We do not need to keep track of individual unit updates.

  gameStateUpdates: Partial<GameState>;
  playerUpdates: Map<string, Partial<Player>>;
  unitsToDelete: ObjectId[]; // Track starved units
  winnerPlayerId: ObjectId | null;
}

export class CycleTickContext {
  game: Game;
  players: Player[];
  hexes: Hex[];
  units: Unit[];
  planets: Planet[];
  stations: Station[];

  playerUpdates = new Map<string, Partial<Player>>();
  unitsToRemove: ObjectId[] = []; // <--- Track killed units
  gameStateUpdates: Partial<GameState> | null = null;
  winnerPlayerId: ObjectId | null = null;

  constructor(
    game: Game,
    players: Player[],
    hexes: Hex[],
    units: Unit[],
    planets: Planet[],
    stations: Station[]
  ) {
    this.game = game;
    this.players = players;
    this.hexes = hexes;
    this.units = units;
    this.planets = planets;
    this.stations = stations;
  }
}

interface MoveIntent {
  unit: Unit;
  fromHexCoord: HexCoords;
  fromCoordId: HexCoordsId;
  toHexCoord: HexCoords;
  toCoordId: HexCoordsId;
}

export class GameUnitMovementContext {
  moveIntents: MoveIntent[] = [];
  movesByDest = new Map<HexCoordsId, MoveIntent[]>(); // Coord ID, Movement Intent

  constructor(context: TickContext) {
    // Gather all units that want to move this tick.
    context.units.forEach((unit) => {
      // Unit must be MOVING, have a path, have MP, and NOT be dead from combat above
      if (
        unit.state.status === UnitStatus.MOVING &&
        unit.movement.path.length > 0 &&
        unit.state.mp > 0 &&
        !context.unitsToRemove.some((id) => String(id) === String(unit._id))
      ) {
        const nextHex = unit.movement.path[0];

        // Bit of defensive programming here to make sure we aren't going to move units that have invalid movement paths.
        if (!HexUtils.isNeighbor(unit.location, nextHex)) {
          throw new Error(
            `Unit next movement hex is not adjacent to the unit's current location.`
          );
        }

        this.moveIntents.push({
          unit,
          fromCoordId: HexUtils.getCoordsID(unit.location),
          toCoordId: HexUtils.getCoordsID(nextHex),
          fromHexCoord: unit.location,
          toHexCoord: nextHex,
        });
      }
    });

    // Group intents by Destination
    this.moveIntents.forEach((intent) => {
      if (!this.movesByDest.has(intent.toCoordId))
        this.movesByDest.set(intent.toCoordId, []);
      this.movesByDest.get(intent.toCoordId)!.push(intent);
    });
  }
}

/**
 * Helper: Handle Territory Capture
 * Called whenever a unit successfully enters a hex (via Movement or Combat Blitz).
 */
const handleHexCapture = (context: TickContext, hex: Hex, unit: Unit) => {
  // 1. Flip Hex Ownership
  hex.playerId = unit.playerId;
  hex.unitId = unit._id;

  const hexCoordsId = HexUtils.getCoordsID(hex.location);

  // Flip Planet Ownership (if one exists here)
  const planet = context.planetLookup.get(hexCoordsId);
  if (planet && String(planet.playerId) !== String(unit.playerId)) {
    planet.playerId = unit.playerId; // Update in-memory object

    context.appendPlanetUpdate(planet._id, {
      playerId: unit.playerId,
    });
  }

  // Destroy hostile stations
  const station = context.stationLookup.get(hexCoordsId);
  if (station && String(station.playerId) !== String(unit.playerId)) {
    hex.stationId = null; // Update in-memory object

    context.stationsToRemove.push(station._id);
  }
};

export const TickProcessor = {
  /**
   * The Main Physics Loop.
   * Executes Combat -> Moves Units -> Handles Collisions -> Updates Territory.
   * Returns objects representing the CHANGES to be made (does not mutate DB directly).
   */
  processTick(context: TickContext): ProcessTickResult {
    TickProcessor.processTickUnitCombat(context);
    TickProcessor.processTickUnitMovement(context);
    TickProcessor.processTickPlayerSupply(context);
    TickProcessor.processTickWinnerCheck(context);

    return {
      gameStateUpdates: context.gameStateUpdates,
      planetUpdates: context.planetUpdates,
      combatReports: context.combatReports,
      unitsToRemove: context.unitsToRemove,
      stationsToRemove: context.stationsToRemove,
    };
  },

  processTickUnitCombat(contextTick: TickContext) {
    // =================================================================================
    // COMBAT RESOLUTION
    // Combat happens BEFORE movement. This allows "Blitz" moves to seize ground.
    // =================================================================================

    // 1. Identify Units Declaring Attack
    const attackers = contextTick.units.filter(
      (u) => u.state.status === UnitStatus.PREPARING
    );

    // 2. Group by Target Hex (To handle Multi-Unit vs Single-Defender scenarios)
    const attacksByHexCoords = new Map<HexCoordsId, Unit[]>();
    attackers.forEach((att) => {
      if (!att.combat.location) return;

      const key = HexUtils.getCoordsID(att.combat.location);

      if (!attacksByHexCoords.has(key)) attacksByHexCoords.set(key, []);

      attacksByHexCoords.get(key)!.push(att);
    });

    // 3. Resolve Battles per Hex
    attacksByHexCoords.forEach((hexAttackers, targetHexCoordsId) => {
      // Sort Attackers: Frigates (High Init) strike before Battleships.
      // Tiebreaker: Units with more MP act faster.
      hexAttackers.sort((a, b) => {
        const unitACtlg = UNIT_CATALOG_ID_MAP.get(a.catalogId)!;
        const unitBCtlg = UNIT_CATALOG_ID_MAP.get(b.catalogId)!;

        const initDiff =
          unitACtlg.stats.initiative - unitBCtlg.stats.initiative;

        if (initDiff !== 0) return initDiff;

        return b.state.mp - a.state.mp;
      });

      // Execute Sequential 1v1s
      for (const attacker of hexAttackers) {
        // Lookup Target Hex
        const targetHex = contextTick.hexLookup.get(targetHexCoordsId);
        if (!targetHex) continue;

        // Lookup Defender (Is there a unit at the location RIGHT NOW?)
        const defender = contextTick.unitLocations.get(targetHexCoordsId);

        // Whiff Check: Did the defender die or retreat in a previous sequence step?
        // Also check Friendly Fire (Attacker vs Attacker race condition)
        if (
          !defender ||
          String(defender.playerId) === String(attacker.playerId)
        ) {
          attacker.state.status = UnitStatus.REGROUPING; // Attack fails/cancels
          attacker.combat.hexId = null;
          attacker.combat.location = null;
          continue;
        }

        // EXECUTE COMBAT
        // advanceOnVictory: TRUE means the unit will move into the hex if they win
        const battleResult = CombatEngine.resolveBattle(
          attacker,
          defender,
          contextTick.hexLookup,
          attacker.combat.operation!,
          attacker.combat.advanceOnVictory!
        );

        // Log Report
        battleResult.report.tick = contextTick.newTick;
        contextTick.combatReports.push(battleResult.report);

        // Defender:
        if (defender.steps.length === 0) {
          // Defender Destroyed
          contextTick.unitsToRemove.push(defender._id);
          contextTick.unitLocations.delete(targetHexCoordsId); // Remove from board
        } else if (
          battleResult.report.defender.retreated &&
          battleResult.retreatHex
        ) {
          // Move the defender
          contextTick.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.defenderHex.location)
          );
          contextTick.unitLocations.set(
            HexUtils.getCoordsID(battleResult.retreatHex.location),
            defender
          );
        }

        // Attacker:
        if (attacker.steps.length === 0) {
          contextTick.unitsToRemove.push(attacker._id);
          contextTick.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.attackerHex.location)
          ); // Remove from board
        } else if (battleResult.attackerWonHex) {
          // Move the attacker
          contextTick.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.attackerHex.location)
          );
          contextTick.unitLocations.set(
            HexUtils.getCoordsID(battleResult.defenderHex.location),
            attacker
          );

          handleHexCapture(contextTick, targetHex, attacker);
        }
      }
    });
  },

  processTickUnitMovement(context: TickContext) {
    const contextMovement = new GameUnitMovementContext(context);

    // =================================================================================
    // COLLISION RESOLUTION & EXECUTION
    // Check for "Crashes" (Multiple units entering same hex, or entering occupied hex)
    // =================================================================================

    contextMovement.movesByDest.forEach((intents, destCoordId) => {
      // Check 1: Is the destination occupied? (Note: unitLocations acts as the live board state)
      const occupier = context.unitLocations.get(destCoordId);

      // Check 2: Are multiple units trying to enter?
      const isCrash = intents.length > 1 || occupier !== undefined;

      if (isCrash) {
        // --- CRASH RESOLUTION ---
        // "The Crash Rule": All movers Bounce, lose MP, and get Suppressed.
        intents.forEach(({ unit }) => {
          unit.state.mp = 0; // Lose momentum
          unit.movement.path = []; // Clear the path
          unit.steps = UnitManager.suppressSteps(unit.steps, 1); // Take damage
          unit.state.status = UnitStatus.REGROUPING; // Forced stop
        });
        // Note: Occupier is unaffected (Interloper Rule)
      } else {
        // --- MOVEMENT SUCCESS ---
        const intent = intents[0];
        const unit = intent.unit;

        // Calculate Cost based on Target Terrain
        const targetHex = context.hexLookup.get(destCoordId)!;

        const fromHex = context.hexLookup.get(intent.fromCoordId)!;
        const toHex = context.hexLookup.get(intent.toCoordId)!;

        const mpCost = MapUtils.getHexMPCost(targetHex, unit.playerId);

        // If unit cannot afford the move, they stall.
        if (unit.state.mp < mpCost) {
          unit.state.status = UnitStatus.IDLE;
          unit.movement.path = [];
          return; // Exit this specific move intent
        }

        UnitManager.moveUnit(unit, fromHex, toHex, mpCost, context.hexLookup);

        // Stop if path done or out of gas
        if (unit.movement.path.length === 0 || unit.state.mp === 0) {
          unit.state.status = UnitStatus.IDLE;
        }

        // Update Working Set
        context.unitLocations.delete(intent.fromCoordId);
        context.unitLocations.set(intent.toCoordId, unit);

        // Update Hexes: Capture New
        handleHexCapture(context, targetHex, unit);
      }
    });
  },

  processTickPlayerSupply(context: TickContext) {
    // Process each Player independently
    context.players.forEach((player) => {
      const playerIdStr = String(player._id);

      // Calculate the supply network for this player and update
      // each unit's supply status.
      const supplyNetwork = SupplyEngine.calculatePlayerSupplyNetwork(
        player._id,
        context.hexes,
        context.planets,
        context.stations,
        context.units
      );

      const playerUnits = context.units.filter(
        (u) => String(u.playerId) === playerIdStr
      );

      playerUnits.forEach((unit) => {
        // Update the unit's supply status
        unit.supply = SupplyEngine.processSupplyTarget(
          unit.supply,
          unit.location,
          supplyNetwork
        );
      });
    });
  },

  processTickWinnerCheck(context: TickContext) {
    // We only check for elimination victory here.
    // Economic victory (VP) is checked in the Cycle Processor.

    // Filter active players (Not defeated)
    const activePlayers = context.players.filter(
      (p) => p.status !== PlayerStatus.DEFEATED
    );

    // Last Man Standing Check
    // Only applies if the game started with > 1 player
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];

      // Update in-memory object
      context.game.state.status = GameStates.COMPLETED;
      context.game.state.winnerPlayerId = winner._id;
      context.game.state.endDate = new Date();

      // DB update:
      context.gameStateUpdates = {
        status: context.game.state.status,
        winnerPlayerId: context.game.state.winnerPlayerId,
        endDate: context.game.state.endDate,
      };
    }
  },

  /**
   * THE MASTER LOOP
   * This function will be called by a Cron Job / Ticker every time a Cycle completes.
   * It modifies the objects in memory. The caller is responsible for saving them to DB afterwards.
   */
  processCycle(context: CycleTickContext): ProcessCycleResult {
    // Process each Player independently
    context.players.forEach((player) => {
      const playerIdStr = String(player._id);

      // LOGISTICS PHASE
      const playerUnits = context.units.filter(
        (u) => String(u.playerId) === playerIdStr
      );

      playerUnits.forEach((unit) => {
        // Run Cycle Logic (Refill AP/MP, Recovery, or Penalties)
        UnitManager.processCycle(unit, context.game.settings.ticksPerCycle);

        // Check for Death (Starvation/Collapse)
        // We merge the update to check the resulting steps
        if (unit.steps.length === 0) {
          // Unit died this cycle
          context.unitsToRemove.push(unit._id);
        }
      });

      // --- ECONOMY PHASE ---
      const ownedPlanets = context.planets.filter(
        (p) => String(p.playerId) === playerIdStr
      );

      // Calculate Prestige Income
      const income = TickProcessor.calculatePrestigeIncome(ownedPlanets);
      const newPrestige = player.prestigePoints + income;

      // Calculate Victory Points (Accumulated per cycle)
      const vpIncome = TickProcessor.calculateVPIncome(ownedPlanets);
      const newVP = player.victoryPoints + vpIncome;

      context.playerUpdates.set(playerIdStr, {
        prestigePoints: newPrestige,
        victoryPoints: newVP,
      });

      // --- VICTORY CHECK ---
      if (newVP >= context.game.settings.victoryPointsToWin) {
        // If multiple players cross the line same tick, highest wins (tie-break logic needed?)
        if (
          !context.winnerPlayerId ||
          newVP >
            (context.players.find((p) => p._id === context.winnerPlayerId)
              ?.victoryPoints || 0)
        ) {
          context.winnerPlayerId = player._id;
        }
      }
    });

    // 2. Game State Update
    // Note: We only increment the Cycle count here. The Ticks are incremented by another process.
    context.gameStateUpdates = {
      cycle: context.game.state.cycle + 1,
      lastTickDate: new Date(),
      winnerPlayerId: context.winnerPlayerId,
    };

    if (context.winnerPlayerId) {
      context.gameStateUpdates.status = GameStates.COMPLETED;
      context.gameStateUpdates.endDate = new Date();
    }

    return {
      gameStateUpdates: context.gameStateUpdates,
      playerUpdates: context.playerUpdates,
      unitsToDelete: context.unitsToRemove,
      winnerPlayerId: context.winnerPlayerId,
    };
  },

  /**
   * Calculate total Prestige generated this cycle
   */
  calculatePrestigeIncome(ownedPlanets: Planet[]): number {
    return ownedPlanets.reduce(
      (total, planet) =>
        total +
        (planet.isCapital
          ? CONSTANTS.PLANET_PRESTIGE_INCOME_CAPITAL
          : CONSTANTS.PLANET_PRESTIGE_INCOME),
      0
    );
  },

  /**
   * Calculate total VPs generated this cycle
   */
  calculateVPIncome(ownedPlanets: Planet[]): number {
    return ownedPlanets.reduce(
      (total, planet) =>
        total +
        (planet.isCapital
          ? CONSTANTS.PLANET_VP_INCOME_CAPITAL
          : CONSTANTS.PLANET_VP_INCOME),
      0
    );
  },
};
