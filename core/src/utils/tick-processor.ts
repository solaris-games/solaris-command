import {
  CONSTANTS,
  ERROR_CODES,
  SPECIALIST_STEP_CATALOG,
  SPECIALIST_STEP_ID_MAP,
  SPECIALIST_STEP_MAP,
  UNIT_CATALOG_ID_MAP,
} from "../data";
import {
  CombatOperation,
  HexCoords,
  HexCoordsId,
  UnifiedId,
  Game,
  Unit,
  UnitStatus,
  Hex,
  Planet,
  Station,
  Player,
  GameStates,
  PlayerStatus,
  GameEvent,
  GameEventTypes,
  TerrainTypes,
  SpecialistStepTypes,
} from "../types";
import { CombatEngine } from "./combat-engine";
import { HexUtils } from "./hex-utils";
import { UnitManager } from "./unit-manager";
import { SupplyEngine } from "./supply-engine";
import { MapUtils } from "./map-utils";

// TODO: Split these into two files, tick-processor.ts and tick-cycle-processor.ts
// This will make it more manageable to write unit tests for.

export interface ProcessTickResult {
  gameEvents: GameEvent[]; // Events from tick processing (e.g combat reports)
  stationsToRemove: UnifiedId[]; // Captured stations to delete
  winnerPlayerId: UnifiedId | null;
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
  gameEvents: GameEvent[] = [];
  stationsToRemove: UnifiedId[] = [];
  winnerPlayerId: UnifiedId | null = null;

  idGenerator: () => UnifiedId;

  constructor(
    game: Game,
    players: Player[],
    hexes: Hex[],
    units: Unit[],
    planets: Planet[],
    stations: Station[],
    idGenerator: () => UnifiedId
  ) {
    this.game = game;
    this.players = players;
    this.hexes = hexes;
    this.units = units;
    this.planets = planets;
    this.stations = stations;

    this.idGenerator = idGenerator;

    // We track unit locations in a Map for O(1) lookup during collision/combat checks.
    // This map is updated continuously as the Tick progresses (e.g., after a Blitz move).
    this.hexLookup = new Map<HexCoordsId, Hex>();
    hexes.forEach((h) =>
      this.hexLookup.set(HexUtils.getCoordsID(h.location), h)
    );

    this.unitLocations = new Map<HexCoordsId, Unit>();
    units.forEach((u) =>
      this.unitLocations.set(HexUtils.getCoordsID(u.location), u)
    );

    // Lookup map for Planets to check for capture logic efficiently
    this.planetLookup = new Map<HexCoordsId, Planet>();
    planets.forEach((p) =>
      this.planetLookup.set(HexUtils.getCoordsID(p.location), p)
    );

    this.stationLookup = new Map<HexCoordsId, Station>();
    stations.forEach((s) =>
      this.stationLookup.set(HexUtils.getCoordsID(s.location), s)
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
        UnitManager.unitIsAlive(unit)
      ) {
        const nextHex = unit.movement.path[0]!;

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
    // If this new tick completes a cycle (e.g., tick 24, 48...)
    const isCycleTick =
      context.game.state.tick % context.game.settings.ticksPerCycle === 0;

    TickProcessor.processTickRegroupingUnitStatus(context);
    TickProcessor.processHexRadiationStorms(context);
    TickProcessor.processTickUnitCombat(context);
    TickProcessor.processTickUnitMovement(context);
    TickProcessor.processTickPlayerSupply(context);

    if (isCycleTick) {
      console.log(
        `💰 Processing Cycle ${context.game.state.cycle + 1} for Game ${
          context.game._id
        }`
      );

      TickProcessor.processCycle(context);
    }

    TickProcessor.processHexZOC(context);
    TickProcessor.processUnitScoutsHexCapture(context);
    TickProcessor.processTickWinnerCheck(context);

    return {
      gameEvents: context.gameEvents,
      stationsToRemove: context.stationsToRemove,
      winnerPlayerId: context.winnerPlayerId,
    };
  },

  processTickRegroupingUnitStatus(context: TickContext) {
    // Reset Action States
    // If units were regrouping from the previous tick, then set them to idle now.
    for (const unit of context.units) {
      if (unit.state.status === UnitStatus.REGROUPING) {
        unit.state.status = UnitStatus.IDLE;
      }
    }
  },

  processTickUnitCombat(context: TickContext) {
    // =================================================================================
    // COMBAT RESOLUTION
    // Combat happens BEFORE movement. This allows "Blitz" moves to seize ground.
    // =================================================================================

    // 1. Identify Units Declaring Attack
    const attackers = context.units.filter(
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
        const targetHex = context.hexLookup.get(targetHexCoordsId);
        if (!targetHex) continue;

        // Lookup Defender (Is there a unit at the location RIGHT NOW?)
        const defender = context.unitLocations.get(targetHexCoordsId);

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
          context.hexLookup,
          attacker.combat.operation!,
          attacker.combat.advanceOnVictory!
        );

        // Clear the attacker's combat order.
        attacker.combat = {
          hexId: null,
          location: null,
          advanceOnVictory: null,
          operation: null,
        };

        // Log Report
        battleResult.report.tick = context.game.state.tick;

        // One for the attacker and another for the defender.
        context.gameEvents.push({
          _id: context.idGenerator(),
          gameId: context.game._id,
          playerId: battleResult.report.attackerId,
          tick: context.game.state.tick,
          type: GameEventTypes.COMBAT_REPORT,
          data: battleResult.report,
        });

        context.gameEvents.push({
          _id: context.idGenerator(),
          gameId: context.game._id,
          playerId: battleResult.report.defenderId,
          tick: context.game.state.tick,
          type: GameEventTypes.COMBAT_REPORT,
          data: battleResult.report,
        });

        // Defender:
        if (!UnitManager.unitIsAlive(defender)) {
          // Defender Destroyed
          // Note: Hex unit reference is handled in battle resolution
          context.unitLocations.delete(targetHexCoordsId); // Remove from board
        } else if (
          battleResult.report.defender.retreated &&
          battleResult.retreatHex
        ) {
          // Move the defender
          context.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.defenderHex.location)
          );
          context.unitLocations.set(
            HexUtils.getCoordsID(battleResult.retreatHex.location),
            defender
          );
        }

        // Attacker:
        if (!UnitManager.unitIsAlive(attacker)) {
          // Attacker destroyed
          // Note: Hex unit reference is handled in battle resolution
          context.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.attackerHex.location)
          ); // Remove from board
        } else if (battleResult.attackerWonHex) {
          // Move the attacker
          context.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.attackerHex.location)
          );
          context.unitLocations.set(
            HexUtils.getCoordsID(battleResult.defenderHex.location),
            attacker
          );

          handleHexCapture(context, targetHex, attacker);
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

    const processUnitMovementSuccess = (intent: MoveIntent) => {
      // --- MOVEMENT SUCCESS ---
      const unit = intent.unit;

      // Calculate Cost based on Target Terrain
      const fromHex = context.hexLookup.get(intent.fromCoordId)!;
      const toHex = context.hexLookup.get(intent.toCoordId)!;

      const mpCost = MapUtils.getHexMPCost(toHex, unit.playerId);

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
      handleHexCapture(context, toHex, unit);
    };

    const processUnitMovementBounce = (intent: MoveIntent) => {
      // Apply the MP movement cost (even though the unit won't actually move)
      const toHex = context.hexLookup.get(intent.toCoordId)!;
      const mpCost = MapUtils.getHexMPCost(toHex, intent.unit.playerId);

      intent.unit.state.mp = Math.max(0, intent.unit.state.mp - mpCost); // Reduce MP
      intent.unit.movement.path = []; // Clear the path
      intent.unit.steps = UnitManager.suppressSteps(intent.unit.steps, 1); // Take damage
      intent.unit.state.status = UnitStatus.REGROUPING; // Forced stop
    };

    contextMovement.movesByDest.forEach((intents, destCoordId) => {
      // If there is already a unit occupying the hex, then this unit should bounce.
      // Note: This is possible if a unit has advanced into a hex through combat.
      const occupier = context.unitLocations.get(destCoordId);

      if (occupier) {
        // All units should bounce and have 1 step suppressed
        intents.forEach(processUnitMovementBounce);
      }
      // If the unit isn't occupied, and more than 1 unit is attempting to enter it
      // then we must resolve who captures the hex.
      else if (intents.length > 1) {
        // The unit with the best initiative will win the hex.
        // Tie-break: Active steps, then total steps.
        const sortedIntents = intents.sort((a, b) => {
          const statsA = UNIT_CATALOG_ID_MAP.get(a.unit.catalogId)!.stats;
          const statsB = UNIT_CATALOG_ID_MAP.get(b.unit.catalogId)!.stats;

          // 1. Primary: Initiative (LOWEST wins)
          // Logic: Ascending order (a - b)
          if (statsA.initiative !== statsB.initiative) {
            return statsA.initiative - statsB.initiative;
          }

          const activeStepsA = UnitManager.getActiveSteps(a.unit).length;
          const activeStepsB = UnitManager.getActiveSteps(b.unit).length;

          // 2. Secondary: Active Steps (Highest wins)
          // Logic: Descending order (b - a)
          if (activeStepsB !== activeStepsA) {
            return activeStepsB - activeStepsA;
          }

          const totalStepsA = a.unit.steps.length;
          const totalStepsB = b.unit.steps.length;

          // 3. Tertiary: Total Steps (Highest wins)
          // Logic: Descending order (b - a)
          if (totalStepsB !== totalStepsA) {
            return totalStepsB - totalStepsA;
          }

          // All are equal.
          // Note: If we want to add true randomness, be careful with the logic. We will
          // have to randomize the intents BEFORE we sort them because randomising inside
          // a sort is dangerous and can lead to glitches or infinite loops.
          return 0;
        });

        processUnitMovementSuccess(sortedIntents[0]!);

        // All other units should bounce
        for (let i = 1; i < sortedIntents.length; i++) {
          processUnitMovementBounce(sortedIntents[i]!);
        }
      }
      // Otherwise, if this is the only unit attempting to enter this unoccupied hex then all good.
      else {
        processUnitMovementSuccess(intents[0]!);
      }
    });
  },

  processTickPlayerSupply(context: TickContext) {
    // Make sure we are working with only the alive entities,
    // they may have been destroyed by combat earlier.
    const liveUnits = context.units.filter((u) => UnitManager.unitIsAlive(u));

    const liveStations = context.stations.filter(
      (s) =>
        !context.stationsToRemove.some((id) => String(id) === String(s._id))
    );

    // Process each Player independently
    context.players.forEach((player) => {
      const playerIdStr = String(player._id);

      // Calculate the supply network for this player and update
      // each unit's supply status.
      const supplyNetwork = SupplyEngine.calculatePlayerSupplyNetwork(
        player._id,
        context.hexes,
        context.planets,
        liveStations
      );

      const playerUnits = liveUnits.filter(
        (u) => String(u.playerId) === playerIdStr
      );

      playerUnits.forEach((unit) => {
        // Update the unit's supply status
        unit.supply = SupplyEngine.processTickSupplyTarget(
          unit.supply,
          unit.location,
          supplyNetwork
        );
      });
    });
  },

  processTickWinnerCheck(context: TickContext) {
    let winnerPlayer: Player | null = null;

    // --- VICTORY BY LAST MAN STANDING CHECK ---
    // Filter active players (Not defeated)
    const activePlayers = context.players.filter(
      (p) => p.status !== PlayerStatus.DEFEATED
    );

    if (activePlayers.length === 1) {
      winnerPlayer = activePlayers[0]!;
    }

    // --- VICTORY BY VP CHECK ---
    if (winnerPlayer == null) {
      winnerPlayer =
        context.players
          .slice() // Create a copy so we don't accidentally reorder the player list.
          .filter(
            (x) =>
              x.status === PlayerStatus.ACTIVE &&
              x.victoryPoints >= context.game.settings.victoryPointsToWin
          )
          .sort((a, b) => {
            // 1. Victory Points (Highest wins)
            if (b.victoryPoints !== a.victoryPoints) {
              return b.victoryPoints - a.victoryPoints;
            }

            // 2. Total Planets (Highest wins)
            const playerPlanetsA = context.planets.filter(
              (p) => p.playerId && String(p.playerId) === String(a._id)
            ).length;
            const playerPlanetsB = context.planets.filter(
              (p) => p.playerId && String(p.playerId) === String(b._id)
            ).length;

            if (playerPlanetsB !== playerPlanetsA) {
              return playerPlanetsB - playerPlanetsA;
            }

            // 3. Total Units (Highest wins)
            const playerUnitsA = context.units.filter(
              (u) =>
                UnitManager.unitIsAlive(u) &&
                u.playerId &&
                String(u.playerId) === String(a._id)
            ).length;
            const playerUnitsB = context.units.filter(
              (u) =>
                UnitManager.unitIsAlive(u) &&
                u.playerId &&
                String(u.playerId) === String(b._id)
            ).length;

            if (playerUnitsB !== playerUnitsA) {
              return playerUnitsB - playerUnitsA;
            }

            // 4. Prestige (Highest wins)
            return b.prestigePoints - a.prestigePoints;
          })[0] ?? null;
    }

    if (winnerPlayer) {
      context.winnerPlayerId = winnerPlayer._id;
      context.game.state.winnerPlayerId = winnerPlayer._id;
      context.game.state.status = GameStates.COMPLETED;
      context.game.state.endDate = new Date();
    }
  },

  processHexRadiationStorms(context: TickContext) {
    // ----- RADIATION STORMS -----
    // Units in radiation storms suffer 1 step suppression.
    const hexes = context.hexes.filter(
      (hex) =>
        hex.unitId != null && hex.terrain === TerrainTypes.RADIATION_STORM
    );

    for (const hex of hexes) {
      const unit = context.units.find(
        (u) => String(u._id) === String(hex.unitId)
      )!;

      unit.steps = UnitManager.suppressSteps(unit.steps, 1);
    }
  },

  processHexZOC(context: TickContext) {
    // ----- UNIT ZOC -----
    // Process unit ZOC. Since unit movement and combat happens at the same time
    // and also cycle ticks can kill starved units
    // we have to process ZOC all at once at the end of the tick.
    // TODO: This can probably be much more efficient but for now let's just keep it simple.

    // Clear all existing ZOC from hexes.
    for (const hex of context.hexes) {
      if (hex.zoc.length > 0) {
        hex.zoc = [];
      }
    }

    // Add ZOC infuence for all ALIVE units
    const liveUnits = context.units.filter((u) => UnitManager.unitIsAlive(u));

    for (const unit of liveUnits) {
      MapUtils.addUnitHexZOC(unit, context.hexLookup);
    }
    // ----------
  },

  processUnitScoutsHexCapture(context: TickContext) {
    // ----- SCOUTS ADJECENT HEX CAPTURES ----
    // Units with the Scouts specialist capture adjacent empty hexes providing that
    // a. The hex is empty.
    // b. The hex is not a planet or station.
    // c. The hex is solely influenced by the unit's player.
    const scoutUnits = context.units
      .filter(
        // Filter only alive units
        (u) => UnitManager.unitIsAlive(u)
      )
      .filter((u) => {
        // Unit must have active scout specialist to do this.
        const hasActiveScoutStep =
          UnitManager.getActiveSpecialistSteps(u).filter((s) => {
            const spec = SPECIALIST_STEP_ID_MAP.get(s.specialistId!)!;

            return spec.type === SpecialistStepTypes.SCOUTS; // Active spec step is a scouts type
          }).length > 0;

        return MapUtils.unitHasZOCInfluence(u) && hasActiveScoutStep;
      });

    for (const unit of scoutUnits) {
      const zocHexes = MapUtils.getUnitHexZOC(unit, context.hexLookup);

      for (const hex of zocHexes) {
        // Scouts cannot capture planets or stations and cannot capture if the hex
        // is already occupied by another unit.
        if (
          hex.unitId != null ||
          hex.planetId != null ||
          hex.stationId != null
        ) {
          continue;
        }

        // No need to do this if the player already owns the hex.
        if (hex.playerId && String(hex.playerId) === String(unit.playerId)) {
          continue;
        }

        // If the hex is being influenced by this player only, then the player will gain control of the hex.
        const zocPlayers = [...new Set(hex.zoc.map((z) => String(z.playerId)))];

        if (
          zocPlayers.length === 1 && // Only one player influencing the hex
          String(zocPlayers[0]) === String(unit.playerId) // And that player is the unit owner (not strictly necessary but is safer to check)
        ) {
          hex.playerId = unit.playerId;
        }
      }
    }
  },

  /**
   * Process the cycle tick
   */
  processCycle(context: TickContext) {
    // Game State Update
    // Note: We only increment the Cycle count here. The Ticks are incremented by another process.
    context.game.state.cycle += 1;

    // Get only alive entities from arrays so that dead ones aren't processed in the cycle
    const liveUnits = context.units.filter((u) => UnitManager.unitIsAlive(u));

    // Process each Player independently
    context.players.forEach((player) => {
      const playerIdStr = String(player._id);

      // LOGISTICS PHASE
      const playerUnits = liveUnits.filter(
        (u) => String(u.playerId) === playerIdStr
      );

      playerUnits.forEach((unit) => {
        // Run Cycle Logic (Refill AP/MP, Recovery, or Penalties)
        UnitManager.processCycle(unit, context.game.settings.ticksPerCycle);

        // Check for Death (Starvation/Collapse)
        // We merge the update to check the resulting steps
        if (!UnitManager.unitIsAlive(unit)) {
          // Unit died this cycle
          // Remove unit from hex
          const hex = context.hexLookup.get(
            HexUtils.getCoordsID(unit.location)
          )!;
          hex.unitId = null;
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
    });
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

  validatePreTickState(context: TickContext) {
    // ----- UNIT COMBAT VALIDATION -----
    // Validate that units preparing to fight are in a valid state and follow the game rules.
    const attackers = context.units.filter(
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
      const hex = context.hexLookup.get(
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

      const targetUnit = context.unitLocations.get(
        HexUtils.getCoordsID(unit.combat.location)
      );

      // Should not happen if hex.unitId is set but double check
      if (!targetUnit) {
        throw new Error(ERROR_CODES.UNIT_NOT_FOUND);
      }

      if (String(targetUnit.playerId) === String(unit.playerId)) {
        throw new Error(ERROR_CODES.UNIT_CANNOT_ATTACK_OWN_UNIT);
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
    const movers = context.units.filter(
      (u) => u.state.status === UnitStatus.MOVING
    );

    for (const unit of movers) {
      if (unit.state.mp === 0) {
        throw new Error(ERROR_CODES.UNIT_INSUFFICIENT_MP);
      }

      if (unit.movement.path.length === 0) {
        throw new Error(ERROR_CODES.MOVEMENT_PATH_INVALID);
      }

      const location = unit.movement.path[0]!;

      const hex = context.hexLookup.get(HexUtils.getCoordsID(location));

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
