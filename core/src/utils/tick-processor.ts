import { CONSTANTS, ERROR_CODES, UNIT_CATALOG_ID_MAP } from "../data";
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
import {
  CombatOperation,
  CombatReport,
  HexCoords,
  HexCoordsId,
  UnifiedId,
} from "../types";
import { CombatEngine } from "./combat-engine";
import { HexUtils } from "./hex-utils";
import { UnitManager } from "./unit-manager";
import { SupplyEngine } from "./supply-engine";
import { MapUtils } from "./map-utils";

// TODO: Split these into two files, tick-processor.ts and tick-cycle-processor.ts
// This will make it more manageable to write unit tests for.

export interface ProcessTickResult {
  combatReports: CombatReport[]; // Logs for the UI
  unitsToRemove: UnifiedId[]; // Dead units to delete
  stationsToRemove: UnifiedId[]; // Captured stations to delete
}

export class TickContext {
  game: Game;
  players: Player[];
  hexes: Hex[];
  units: Unit[];
  planets: Planet[];
  stations: Station[];

  // --- WORKING SETS (In-Memory State) ---
  // We track unit locations in a Map for O(1) lookup during collision/combat checks.
  // This map is updated continuously as the Tick progresses (e.g., after a Blitz move).
  hexLookup: Map<HexCoordsId, Hex>;
  unitLocations: Map<HexCoordsId, Unit>;
  planetLookup: Map<HexCoordsId, Planet>;
  stationLookup: Map<HexCoordsId, Station>;

  // --- OUTPUT CONTAINERS ---
  combatReports: CombatReport[] = [];
  unitsToRemove: UnifiedId[] = [];
  stationsToRemove: UnifiedId[] = [];

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
  unitsToDelete: UnifiedId[]; // Track starved units
  winnerPlayerId: UnifiedId | null;
}

export class CycleTickContext {
  game: Game;
  players: Player[];
  hexes: Hex[];
  units: Unit[];
  planets: Planet[];
  stations: Station[];

  unitsToRemove: UnifiedId[] = []; // <--- Track killed units
  winnerPlayerId: UnifiedId | null = null;

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

export class PostTickContext {
  hexes: Hex[];
  units: Unit[];

  hexLookup: Map<HexCoordsId, Hex>;

  constructor(hexes: Hex[], units: Unit[]) {
    this.hexes = hexes;
    this.units = units;

    this.hexLookup = new Map<string, Hex>();
    hexes.forEach((h) =>
      this.hexLookup.set(HexUtils.getCoordsID(h.location), h)
    );
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
      // Note: We validate all unit movements before the tick processes, so we do not need to check additional properties, only that the unit is moving.
      if (
        unit.state.status === UnitStatus.MOVING &&
        !context.unitsToRemove.some((id) => String(id) === String(unit._id))
      ) {
        const nextHex = unit.movement.path[0];

        this.moveIntents.push({
          unit,
          fromCoordId: HexUtils.getCoordsID(unit.location),
          fromHexCoord: unit.location,
          toCoordId: HexUtils.getCoordsID(nextHex),
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
    planet.playerId = unit.playerId;
  }

  // Destroy hostile stations
  const station = context.stationLookup.get(hexCoordsId);
  if (station && String(station.playerId) !== String(unit.playerId)) {
    hex.stationId = null;

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
        battleResult.report.tick = contextTick.game.state.tick;
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

        UnitManager.moveUnit(unit, fromHex, toHex, mpCost);

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
        context.stations
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
    }
  },

  processPostTick(context: PostTickContext) {
    // ----- UNIT ZOC -----
    // Process unit ZOC. Since unit movement and combat happens at the same time
    // we have to process ZOC all at once at the end of the tick.
    // TODO: This can probably be much more efficient but for now let's just keep it simple.

    // Clear all existing ZOC from hexes.
    for (const hex of context.hexes) {
      if (hex.zoc.length > 0) {
        hex.zoc = [];
      }
    }

    // Add ZOC infuence for all units
    for (const unit of context.units) {
      MapUtils.addUnitHexZOC(unit, context.hexLookup);
    }
    // ----------
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

      player.prestigePoints = newPrestige;
      player.victoryPoints = newVP;

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
    context.game.state.cycle += 1;
    context.game.state.lastTickDate = new Date();
    context.game.state.winnerPlayerId = context.winnerPlayerId;

    if (context.winnerPlayerId) {
      context.game.state.status = GameStates.COMPLETED;
      context.game.state.endDate = new Date();
    }

    return {
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

  validateGameState(contextTick: TickContext) {
    // ----- UNIT COMBAT VALIDATION -----
    // Validate that units preparing to fight are in a valid state and follow the game rules.
    const attackers = contextTick.units.filter(
      (u) => u.state.status === UnitStatus.PREPARING
    );

    for (const unit of attackers) {
      // Must have enough AP
      if (unit.state.ap === 0) {
        throw new Error(ERROR_CODES.UNIT_INSUFFICIENT_AP);
      }

      // Combat config must be correct
      if (unit.combat.hexId == null || unit.combat.location == null) {
        throw new Error(ERROR_CODES.UNIT_INVALID_COMBAT_STATE);
      }

      // Hex must exist
      const hex = contextTick.hexLookup.get(
        HexUtils.getCoordsID(unit.combat.location)
      );

      if (!hex) {
        throw new Error(ERROR_CODES.HEX_NOT_FOUND);
      }

      // Hex ID must match location
      if (String(hex._id) !== String(unit.combat.hexId)) {
        throw new Error(ERROR_CODES.HEX_ID_INVALID);
      }

      // Hex must be a neighbor of the attacker's hex
      if (!HexUtils.isNeighbor(unit.location, unit.combat.location)) {
        throw new Error(ERROR_CODES.HEX_IS_NOT_ADJACENT);
      }

      // Hex must contain a unit
      if (!hex.unitId) {
        throw new Error(ERROR_CODES.HEX_IS_NOT_OCCUPIED_BY_UNIT);
      }

      // Suppressive fire must have an active specialist step
      if (unit.combat.operation === CombatOperation.SUPPRESSIVE_FIRE) {
        const hasArtillery = UnitManager.unitHasActiveSpecialistStep(unit);

        if (!hasArtillery) {
          throw new Error(
            ERROR_CODES.UNIT_MUST_HAVE_ACTIVE_ARTILLERY_SPECIALIST
          );
        }
      }
    }

    // ----- UNIT MOVEMENT VALIDATION -----
    // Validate the units preparing to move are in a valid state and follow the game rules.
    const movers = contextTick.units.filter(
      (u) => u.state.status === UnitStatus.MOVING
    );

    for (const unit of movers) {
      if (unit.state.mp === 0) {
        throw new Error(ERROR_CODES.UNIT_INSUFFICIENT_MP);
      }

      if (unit.movement.path.length === 0) {
        throw new Error(ERROR_CODES.MOVEMENT_PATH_INVALID);
      }

      const location = unit.movement.path[0];

      const hex = contextTick.hexLookup.get(HexUtils.getCoordsID(location));

      if (!hex) {
        throw new Error(ERROR_CODES.HEX_NOT_FOUND);
      }

      // Hex must be a neighbor of the unit's hex
      if (!HexUtils.isNeighbor(unit.location, location)) {
        throw new Error(ERROR_CODES.HEX_IS_NOT_ADJACENT);
      }

      if (MapUtils.isHexImpassable(hex)) {
        throw new Error(ERROR_CODES.MOVEMENT_PATH_IMPASSABLE);
      }

      // Note: We do not validate MP cost of hex because that logic is handled in the movement processor (stall unit)
    }
  },
};
