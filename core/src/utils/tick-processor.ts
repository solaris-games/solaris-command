import { ObjectId } from "mongodb";
import { CONSTANTS, TERRAIN_MP_COSTS, UNIT_CATALOG_ID_MAP } from "../data";
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
} from "../models";
import { CombatReport } from "../types";
import { CombatEngine } from "./combat-engine";
import { HexUtils } from "./hex-utils";
import { UnitManager } from "./unit-manager";
import { SupplyEngine } from "./supply-engine";
import { MapUtils } from "./map-utils";

// TODO: Split these into two files, tick-processor.ts and tick-cycle-processor.ts
// This will make it more manageable to write unit tests for.

export interface ProcessTickResult {
  // Note: Unit updates are not present here since units are ALWAYS updated every tick. We do not need to keep track of individual unit updates.

  gameUpdates: Partial<Game> | null;
  hexUpdates: Map<string, Partial<Hex>>; // Partial updates (unitId, playerId)
  planetUpdates: Map<string, Partial<Planet>>; // Capture updates
  combatReports: CombatReport[]; // Logs for the UI
  unitsToRemove: ObjectId[]; // Dead units to delete
  stationsToRemove: ObjectId[]; // Captured stations to delete
}

class TickContext {
  currentTick: number;
  game: Game;
  players: Player[];
  hexes: Hex[];
  units: Unit[];
  planets: Planet[];
  stations: Station[];

  // --- WORKING SETS (In-Memory State) ---
  // We track unit locations in a Map for O(1) lookup during collision/combat checks.
  // This map is updated continuously as the Tick progresses (e.g., after a Blitz move).
  hexLookup = new Map<string, Hex>();
  unitLocations = new Map<string, Unit>();
  planetLookup = new Map<string, Planet>();
  stationLookup = new Map<string, Station>();

  // --- OUTPUT CONTAINERS ---
  gameUpdates: Partial<Game> | null = null;
  hexUpdates = new Map<string, Partial<Hex>>();
  planetUpdates = new Map<string, Partial<Planet>>();
  combatReports: CombatReport[] = [];
  unitsToRemove: ObjectId[] = [];
  stationsToRemove: ObjectId[] = [];

  constructor(
    currentTick: number,
    game: Game,
    players: Player[],
    hexes: Hex[],
    units: Unit[],
    planets: Planet[],
    stations: Station[]
  ) {
    this.currentTick = currentTick;
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
}

export interface ProcessCycleResult {
  // Note: Unit updates are not present here since units are ALWAYS updated every tick. We do not need to keep track of individual unit updates.

  gameUpdates: Partial<Game>;
  playerUpdates: Map<string, Partial<Player>>;
  unitsToDelete: ObjectId[]; // Track starved units
  winnerPlayerId: ObjectId | null;
}

class CycleTickContext {
  playerUpdates = new Map<string, Partial<Player>>();
  unitsToRemove: ObjectId[] = []; // <--- Track killed units
  gameUpdates: Partial<Game> | null = null;
  winnerPlayerId: ObjectId | null = null;

  constructor() {}
}

interface MoveIntent {
  unit: Unit;
  from: string;
  to: string;
  toCoord: any;
}

export class GameUnitMovementContext {
  moveIntents: MoveIntent[] = [];
  movesByDest = new Map<string, MoveIntent[]>();
  zocMap: Map<string, Set<string>>;

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
          from: HexUtils.getCoordsID(unit.location),
          to: HexUtils.getCoordsID(nextHex),
          toCoord: nextHex,
        });
      }
    });

    // Group intents by Destination
    this.moveIntents.forEach((intent) => {
      if (!this.movesByDest.has(intent.to)) this.movesByDest.set(intent.to, []);
      this.movesByDest.get(intent.to)!.push(intent);
    });

    // We calculate ZOC *once* based on the board state at the start of movement.
    // This ensures simultaneous fairness and O(1) lookups inside the loop.
    // Note: We filter out units that died in Phase 1 (Combat) so they don't block movement.
    const aliveUnits = context.units.filter(
      (u) =>
        !context.unitsToRemove.some(
          (deadId) => String(deadId) === String(u._id)
        )
    );
    this.zocMap = MapUtils.calculateZOCMap(aliveUnits);
  }
}

/**
 * Helper: Handle Territory Capture
 * Called whenever a unit successfully enters a hex (via Movement or Combat Blitz).
 */
const handleHexCapture = (context: TickContext, hexId: string, unit: Unit) => {
  // 1. Flip Hex Ownership
  const existingHexUpdate = context.hexUpdates.get(hexId) || {};
  context.hexUpdates.set(hexId, {
    ...existingHexUpdate,
    unitId: unit._id, // Unit is now seated here
    playerId: unit.playerId, // Territory flips to Unit owner
  });

  // 2. Flip Planet Ownership (if one exists here)
  const planet = context.planetLookup.get(hexId);
  if (planet && String(planet.playerId) !== String(unit.playerId)) {
    context.planetUpdates.set(planet._id.toString(), {
      playerId: unit.playerId,
    });
  }

  // 3. Destroy hostile stations
  const station = context.stationLookup.get(hexId);
  if (station && String(station.playerId) !== String(unit.playerId)) {
    context.stationsToRemove.push(station._id);
  }
};

export const TickProcessor = {
  /**
   * The Main Physics Loop.
   * Executes Combat -> Moves Units -> Handles Collisions -> Updates Territory.
   * Returns objects representing the CHANGES to be made (does not mutate DB directly).
   */
  processTick(
    game: Game,
    players: Player[],
    hexes: Hex[],
    units: Unit[],
    planets: Planet[],
    stations: Station[]
  ): ProcessTickResult {
    const currentTick = game.state.tick + 1;

    const context = new TickContext(
      currentTick,
      game,
      players,
      hexes,
      units,
      planets,
      stations
    );

    TickProcessor.processTickUnitCombat(context);
    TickProcessor.processTickUnitMovement(context);
    TickProcessor.processTickPlayerSupply(context);
    TickProcessor.processTickWinnerCheck(context);

    return {
      gameUpdates: context.gameUpdates,
      hexUpdates: context.hexUpdates,
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
    const attacksByHex = new Map<string, Unit[]>();
    attackers.forEach((att) => {
      if (!att.combat.hexId) return;

      const key = String(att.combat.hexId);

      if (!attacksByHex.has(key)) attacksByHex.set(key, []);

      attacksByHex.get(key)!.push(att);
    });

    // 3. Resolve Battles per Hex
    attacksByHex.forEach((hexAttackers, targetHexId) => {
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
        const targetHex = contextTick.hexLookup.get(targetHexId);
        if (!targetHex) continue;

        // Lookup Defender (Is there a unit at the location RIGHT NOW?)
        const defender = contextTick.unitLocations.get(targetHexId);

        // Whiff Check: Did the defender die or retreat in a previous sequence step?
        // Also check Friendly Fire (Attacker vs Attacker race condition)
        if (
          !defender ||
          String(defender.playerId) === String(attacker.playerId)
        ) {
          attacker.state.status = UnitStatus.REGROUPING; // Attack fails/cancels
          attacker.combat.hexId = null;
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
        battleResult.report.tick = contextTick.currentTick;
        contextTick.combatReports.push(battleResult.report);

        // Check Casualties
        if (attacker.steps.length === 0)
          contextTick.unitsToRemove.push(attacker._id);

        if (defender.steps.length === 0) {
          // Defender Destroyed
          contextTick.unitsToRemove.push(defender._id);
          contextTick.unitLocations.delete(targetHexId); // Remove from board
          contextTick.hexUpdates.set(targetHexId, { unitId: null }); // Clear seat
        } else if (battleResult.report.defender.retreated) {
          // Defender Retreated
          contextTick.unitLocations.delete(targetHexId); // Left old hex
          const newDefLoc = HexUtils.getCoordsID(defender.location);
          contextTick.unitLocations.set(newDefLoc, defender); // Occupy new hex

          contextTick.hexUpdates.set(targetHexId, { unitId: null }); // Clear old seat
          // Note: Defender implicitly "captures" retreat hex, or at least occupies it
          const existing = contextTick.hexUpdates.get(newDefLoc) || {};
          contextTick.hexUpdates.set(newDefLoc, {
            ...existing,
            unitId: defender._id,
          });
        }

        // Handle Blitz (Advance on Victory)
        if (battleResult.attackerWonHex) {
          const oldLoc = HexUtils.getCoordsID(attacker.location);

          // Update Memory
          contextTick.unitLocations.delete(oldLoc);
          contextTick.unitLocations.set(targetHexId, attacker);

          // Update DB: Vacate old hex
          contextTick.hexUpdates.set(oldLoc, { unitId: null });

          // Update DB: Capture new hex (and planet)
          handleHexCapture(contextTick, targetHexId, attacker);
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

    contextMovement.movesByDest.forEach((intents, destId) => {
      // Check 1: Is the destination occupied? (Note: unitLocations acts as the live board state)
      const occupier = context.unitLocations.get(destId);

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
        const targetHex = context.hexLookup.get(destId)!;

        let mpCost = TERRAIN_MP_COSTS[targetHex.terrain];

        // Moving into a hex that is in a Zone of Control (ZOC) of an enemy unit DOUBLES the MP cost of that hex.
        const isZOC = MapUtils.isHexInEnemyZOC(
          HexUtils.getCoordsID(targetHex.location),
          String(unit.playerId),
          contextMovement.zocMap
        );

        if (isZOC) {
          mpCost *= 2;
        }

        // If unit cannot afford the move, they stall.
        if (unit.state.mp < mpCost) {
          unit.state.status = UnitStatus.IDLE;
          unit.movement.path = [];
          return; // Exit this specific move intent
        }

        // Apply State Changes
        unit.location = intent.toCoord;
        unit.state.mp = Math.max(0, unit.state.mp - mpCost);
        unit.movement.path.shift(); // Pop the step

        // Stop if path done or out of gas
        if (unit.movement.path.length === 0 || unit.state.mp === 0) {
          unit.state.status = UnitStatus.IDLE;
        }

        // Update Working Set (for next logic steps, though this is the end of tick)
        context.unitLocations.delete(intent.from);
        context.unitLocations.set(intent.to, unit);

        // Update Hexes: Vacate Old
        context.hexUpdates.set(intent.from, { unitId: null });

        // Update Hexes: Capture New
        handleHexCapture(context, destId, unit);
      }
    });
  },

  processTickPlayerSupply(context: TickContext) {
    // Process each Player independently
    context.players.forEach((player) => {
      const playerIdStr = player._id.toString();

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
        (u) => u.playerId.toString() === playerIdStr
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

      context.gameUpdates = {
        state: {
          ...context.game.state,
          status: GameStates.COMPLETED,
          winnerPlayerId: winner._id,
          endDate: new Date(),
        },
      };
    }
  },

  /**
   * THE MASTER LOOP
   * This function will be called by a Cron Job / Ticker every time a Cycle completes.
   * It modifies the objects in memory. The caller is responsible for saving them to DB afterwards.
   */
  processCycle(
    game: Game,
    players: Player[],
    units: Unit[],
    planets: Planet[]
  ): ProcessCycleResult {
    const context = new CycleTickContext();

    // Process each Player independently
    players.forEach((player) => {
      const playerIdStr = player._id.toString();

      // LOGISTICS PHASE
      const playerUnits = units.filter(
        (u) => u.playerId.toString() === playerIdStr
      );

      playerUnits.forEach((unit) => {
        // Run Cycle Logic (Refill AP/MP, Recovery, or Penalties)
        UnitManager.processCycle(
          unit,
          game.settings.ticksPerCycle
        );

        // Check for Death (Starvation/Collapse)
        // We merge the update to check the resulting steps
        if (unit.steps.length === 0) {
          // Unit died this cycle
          context.unitsToRemove.push(unit._id);
        }
      });

      // --- ECONOMY PHASE ---
      const ownedPlanets = planets.filter(
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
      if (newVP >= game.settings.victoryPointsToWin) {
        // If multiple players cross the line same tick, highest wins (tie-break logic needed?)
        if (
          !context.winnerPlayerId ||
          newVP >
            (players.find((p) => p._id === context.winnerPlayerId)
              ?.victoryPoints || 0)
        ) {
          context.winnerPlayerId = player._id;
        }
      }
    });

    // 2. Game State Update
    // Note: We only increment the Cycle count here. The Ticks are incremented by another process.
    context.gameUpdates = {
      state: {
        ...game.state,
        cycle: game.state.cycle + 1,
        lastTickDate: new Date(),
        winnerPlayerId: context.winnerPlayerId,
      },
    };

    if (context.winnerPlayerId) {
      context.gameUpdates.state!.status = GameStates.COMPLETED;
      context.gameUpdates.state!.endDate = new Date();
    }

    return {
      gameUpdates: context.gameUpdates,
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
