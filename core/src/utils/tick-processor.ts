import { CombatEngine } from "./combat-engine";
import { HexUtils } from "./hex-utils";
import { UnitManager } from "./unit-manager";
import { SupplyEngine } from "./supply-engine";
import { MapUtils } from "./map-utils";
import { PlanetUtils } from "./planet-utils";
import { GameLeaderboardUtils } from "./game-leaderboard";
import { UnifiedId } from "../types/unified-id";
import { GameEvent, GameEventTypes } from "../types/game-event";
import { GameStates } from "../types/game";
import { Player, PlayerStatus } from "../types/player";
import { Hex, HexZOCEntry, TerrainTypes } from "../types/hex";
import { SpecialistStepTypes, Unit, UnitStatus, UnitStep } from "../types/unit";
import { Planet } from "../types/planet";
import { HexCoordsId } from "../types/geometry";
import { UNIT_CATALOG_ID_MAP } from "../data/units";
import { SPECIALIST_STEP_ID_MAP } from "../data/specialists";
import { CONSTANTS } from "../data/constants";
import { ERROR_CODES } from "../data/error-codes";
import { CombatOperation } from "../types/combat";
import { TickContext } from "../types/tick";
import { AISystem } from "./ai-system";

export interface ProcessTickResult {
  gameEvents: GameEvent[]; // Events from tick processing (e.g combat reports)
  stationsToRemove: UnifiedId[]; // Captured stations to delete
  winnerPlayerId: UnifiedId | null;
}

export { TickContext };

interface MoveIntent {
  unit: Unit;
  fromCoordId: HexCoordsId;
  fromHex: Hex;
  toCoordId: HexCoordsId;
  toHex: Hex;
}

/**
 * Sorts units by iniative.
 * This is used by movement and combat to determine which units execute their action first.
 * Tie breaks: MP, active steps, total steps
 */
const SORT_UNITS_BY_INITIATIVE = (a: Unit, b: Unit) => {
  const statsA = UNIT_CATALOG_ID_MAP.get(a.catalogId)!.stats;
  const statsB = UNIT_CATALOG_ID_MAP.get(b.catalogId)!.stats;

  // 1. Initiative (LOWEST wins)
  // Logic: Ascending order (a - b)
  if (statsA.initiative !== statsB.initiative) {
    return statsA.initiative - statsB.initiative;
  }

  // 2. MP (Highest wins)
  // Logic: Descending order (b - a)
  const mpA = a.state.mp;
  const mpB = b.state.mp;

  if (mpB !== mpA) {
    return mpB - mpA;
  }

  // 3. Active Steps (Highest wins)
  // Logic: Descending order (b - a)
  const activeStepsA = UnitManager.getActiveSteps(a).length;
  const activeStepsB = UnitManager.getActiveSteps(b).length;

  if (activeStepsB !== activeStepsA) {
    return activeStepsB - activeStepsA;
  }

  const totalStepsA = a.steps.length;
  const totalStepsB = b.steps.length;

  // 4. Total Steps (Highest wins)
  // Logic: Descending order (b - a)
  if (totalStepsB !== totalStepsA) {
    return totalStepsB - totalStepsA;
  }

  // All are equal.
  // Note: If we want to add true randomness, be careful with the logic. We will
  // have to randomize the intents BEFORE we sort them because randomising inside
  // a sort is dangerous and can lead to glitches or infinite loops.
  return 0;
};

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
        const nextHexCoord = unit.movement.path[0]!;

        const fromCoordId = HexUtils.getCoordsID(unit.location);
        const fromHex = context.hexLookup.get(fromCoordId)!;
        const toCoordId = HexUtils.getCoordsID(nextHexCoord);
        const toHex = context.hexLookup.get(toCoordId)!;

        this.moveIntents.push({
          unit,
          fromCoordId,
          fromHex,
          toCoordId,
          toHex,
        });
      }
    });

    // We need to sort the movements by destinations that are not occupied first.
    // This prevents clashes where units attempt to move into hexes that are occupied by
    // another unit that is about to leave that hex.
    // Sorting in this way ensures that units move into empty hexes first, clearing the way
    // for the unit _behind_ it to move into the now empty hex.
    this.moveIntents = this.moveIntents.sort((a, b) => {
      if (a.toHex.unitId == null && b.toHex.unitId != null) {
        return -1;
      }

      if (a.toHex.unitId != null && b.toHex.unitId == null) {
        return 1;
      }

      return 0; // Both are empty
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
    const ownerPlayer = context.playerLookup.get(String(planet.playerId));
    const capturedByPlayer = context.playerLookup.get(String(unit.playerId))!;

    context.appendGameEvent(
      null, // Everyone
      GameEventTypes.PLANET_CAPTURED,
      {
        planetId: planet._id,
        planetName: planet.name,
        hexId: planet.hexId,
        location: planet.location,
        ownerPlayerId: ownerPlayer?._id ?? null,
        ownerPlayerAlias: ownerPlayer?.alias ?? null,
        ownerPlayerColor: ownerPlayer?.color ?? null,
        capturedByPlayerId: capturedByPlayer._id,
        capturedByPlayerAlias: capturedByPlayer.alias,
        capturedByPlayerColor: capturedByPlayer.color,
      },
    );

    planet.playerId = unit.playerId;
  }

  // Destroy hostile stations
  const station = context.stationLookup.get(hexCoordsId);
  if (station && String(station.playerId) !== String(unit.playerId)) {
    const ownerPlayer = context.playerLookup.get(String(station.playerId))!;
    const destroyedByPlayer = context.playerLookup.get(String(unit.playerId))!;

    context.appendGameEvent(
      null, // Everyone
      GameEventTypes.PLAYER_DECOMMISSIONED_STATION,
      {
        stationId: station._id,
        hexId: station.hexId,
        location: station.location,
        ownerPlayerId: ownerPlayer._id,
        ownerPlayerAlias: ownerPlayer.alias,
        ownerPlayerColor: ownerPlayer.color,
        destroyedByPlayerId: destroyedByPlayer._id,
        destroyedByPlayerAlias: destroyedByPlayer.alias,
        destroyedByPlayerColor: destroyedByPlayer.color,
      },
    );

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
    // If this new tick completes a cycle (e.g., tick 20, 40...)
    const isCycleTick =
      context.game.state.tick % context.game.settings.ticksPerCycle === 0;

    TickProcessor.processTickPlayerAFK(context);
    TickProcessor.processHexRadiationStorms(context);
    TickProcessor.processTickUnitCombat(context);
    TickProcessor.processTickUnitMovement(context);
    TickProcessor.processTickPlayerSupply(context);

    if (isCycleTick) {
      console.log(
        `💰 Processing Cycle ${context.game.state.cycle + 1} for Game ${
          context.game._id
        }`,
      );

      TickProcessor.processCycle(context);
    }

    TickProcessor.processHexZOC(context);
    TickProcessor.processUnitScoutsHexCapture(context);
    TickProcessor.processTickRegroupingUnitStatus(context);
    TickProcessor.processPlayerDefeatedCheck(context);
    TickProcessor.processTickWinnerCheck(context);

    if (context.winnerPlayerId == null) {
      AISystem.processAIPlayers(context);
    }

    return {
      gameEvents: context.gameEvents,
      stationsToRemove: context.stationsToRemove,
      winnerPlayerId: context.winnerPlayerId,
    };
  },

  processTickRegroupingUnitStatus(context: TickContext) {
    // Reset Action States

    // If units were regrouping from the previous tick
    // and were NOT involved in combat, then set them to idle now.
    for (const [, unit] of context.preTickRegroupingUnits) {
      const isStillRegrouping = context.postTickRegroupingUnits.has(
        String(unit._id),
      );

      if (!isStillRegrouping) {
        unit.state.status = UnitStatus.IDLE;
      }
    }

    // Unit combat takes 'regrouping' status into account when calculating
    // combat shifts (defender disorganised) therefore we must change
    // the status' of units that have been involved in combat AFTER ALL
    // combat has resolved.
    // Since all combat is resolved simultaneously, we can't mark units as regrouping
    // after each individual combat since they may be unfairly penalised by other combat events
    // they take part in in a single tick.
    for (const [, unit] of context.postTickRegroupingUnits) {
      if (unit.state.status !== UnitStatus.REGROUPING) {
        unit.state.status = UnitStatus.REGROUPING;
      }
    }
  },

  processTickPlayerAFK(context: TickContext) {
    // Only check AFK status if the game has started
    if (!context.game.state.startDate) {
      return;
    }

    const AFK_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 Hours
    const now = new Date();

    for (const player of context.players) {
      // Don't touch defeated players or players who are alerady AFK.
      if (
        player.status === PlayerStatus.DEFEATED ||
        player.status === PlayerStatus.AFK
      ) {
        continue;
      }

      const lastSeen = player.lastSeenDate
        ? new Date(player.lastSeenDate)
        : new Date(0);
      const gameStart = new Date(context.game.state.startDate);

      // Effective Last Activity = max(player.lastSeenDate, game.state.startDate)
      // This ensures we don't mark players AFK immediately if they joined way before the game started.
      const effectiveLastActivity =
        lastSeen.getTime() > gameStart.getTime() ? lastSeen : gameStart;

      if (now.getTime() - effectiveLastActivity.getTime() > AFK_TIMEOUT_MS) {
        player.status = PlayerStatus.AFK;
        player.isAIControlled = true;

        context.appendGameEvent(null, GameEventTypes.PLAYER_AFK, {
          playerId: player._id,
          alias: player.alias,
          color: player.color,
        });
      }
    }
  },

  processTickUnitCombat(context: TickContext) {
    // =================================================================================
    // COMBAT RESOLUTION
    // Combat happens BEFORE movement. This allows "Blitz" moves to seize ground.
    // =================================================================================

    // 1. Identify Units Declaring Attack
    // Sort Attackers: Frigates (High Init) strike before Battleships.
    // Tiebreaker: Units with more MP act faster.
    const attackers = context.units
      .filter((u) => u.state.status === UnitStatus.PREPARING)
      .sort(SORT_UNITS_BY_INITIATIVE);

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
      // Execute Sequential 1v1s
      // Note: The attackers will be pre-sorted by initiative and MP.
      for (const attacker of hexAttackers) {
        // Lookup Target Hex
        const targetHex = context.hexLookup.get(targetHexCoordsId);
        if (!targetHex) continue;

        // Lookup Defender (Is there a unit at the location RIGHT NOW?)
        const defender = context.unitLocations.get(targetHexCoordsId);

        const attackerCanAttack = CombatEngine.unitCanAttack(
          attacker,
          targetHex,
        );

        // Whiff Check: Did the defender die, retreat in a previous sequence step or move as part of another battle?
        // Also check Friendly Fire (Attacker vs Attacker race condition)
        if (
          !defender ||
          String(defender.playerId) === String(attacker.playerId) ||
          !attackerCanAttack
        ) {
          context.appendGameEvent(
            attacker.playerId,
            GameEventTypes.UNIT_COMBAT_ATTACK_CANCELLED,
            {
              unitId: attacker._id,
              catalogId: attacker.catalogId,
              combat: {
                hexId: attacker.combat.hexId,
                location: attacker.combat.location,
                operation: attacker.combat.operation,
                advanceOnVictory: attacker.combat.advanceOnVictory,
              },
            },
          );

          // Attack fails/cancels
          attacker.combat.hexId = null;
          attacker.combat.location = null;

          // Set the unit to regrouping at the end of the tick.
          context.postTickRegroupingUnits.set(String(attacker._id), attacker);

          continue;
        }

        // EXECUTE COMBAT
        // advanceOnVictory: TRUE means the unit will move into the hex if they win
        const battleResult = CombatEngine.resolveBattle(
          attacker,
          defender,
          context.hexLookup,
          attacker.combat.operation!,
          attacker.combat.advanceOnVictory!,
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
        battleResult.report.cycle = context.game.state.cycle;

        // One for the attacker and another for the defender.
        context.appendGameEvent(
          battleResult.report.attackerPlayerId,
          GameEventTypes.COMBAT_REPORT,
          battleResult.report,
        );

        context.appendGameEvent(
          battleResult.report.defenderPlayerId,
          GameEventTypes.COMBAT_REPORT,
          battleResult.report,
        );

        // Keep track of which units are regrouping
        if (
          UnitManager.unitIsAlive(defender) &&
          battleResult.report.defender.disorganised &&
          !context.postTickRegroupingUnits.has(String(defender._id))
        ) {
          context.postTickRegroupingUnits.set(String(defender._id), defender);
        }
        if (
          UnitManager.unitIsAlive(attacker) &&
          battleResult.report.attacker.disorganised &&
          !context.postTickRegroupingUnits.has(String(attacker._id))
        ) {
          context.postTickRegroupingUnits.set(String(attacker._id), attacker);
        }

        // Defender:
        if (!UnitManager.unitIsAlive(defender)) {
          // Defender Destroyed
          // Note: Hex unit reference is handled in battle resolution
          context.unitLocations.delete(targetHexCoordsId); // Remove from board

          context.appendGameEvent(
            defender.playerId,
            GameEventTypes.UNIT_DESTROYED_IN_COMBAT,
            {
              unitId: defender._id,
              catalogId: defender.catalogId,
              hexId: defender.hexId,
              location: defender.location,
            },
          );
        } else if (
          battleResult.report.defender.retreated &&
          battleResult.retreatHex
        ) {
          // Move the defender
          context.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.defenderHex.location),
          );
          context.unitLocations.set(
            HexUtils.getCoordsID(battleResult.retreatHex.location),
            defender,
          );
        }

        // Attacker:
        if (!UnitManager.unitIsAlive(attacker)) {
          // Attacker destroyed
          // Note: Hex unit reference is handled in battle resolution
          context.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.attackerHex.location),
          ); // Remove from board

          context.appendGameEvent(
            attacker.playerId,
            GameEventTypes.UNIT_DESTROYED_IN_COMBAT,
            {
              unitId: attacker._id,
              catalogId: attacker.catalogId,
              hexId: attacker.hexId,
              location: attacker.location,
            },
          );
        } else if (battleResult.attackerWonHex) {
          // Move the attacker
          context.unitLocations.delete(
            HexUtils.getCoordsID(battleResult.attackerHex.location),
          );
          context.unitLocations.set(
            HexUtils.getCoordsID(battleResult.defenderHex.location),
            attacker,
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

    // --- MOVEMENT SUCCESS ---
    const processUnitMovementSuccess = (intent: MoveIntent) => {
      // Calculate Cost based on Target Terrain
      const mpCost = MapUtils.getHexMPCost(intent.toHex, intent.unit.playerId);

      // If unit cannot afford the move, they stall.
      if (intent.unit.state.mp < mpCost) {
        intent.unit.state.status = UnitStatus.IDLE;
        intent.unit.movement.path = [];

        context.appendGameEvent(
          intent.unit.playerId, // Owner of the unit
          GameEventTypes.UNIT_MOVEMENT_STALLED,
          {
            unitId: intent.unit._id,
            catalogId: intent.unit.catalogId,
            toHexId: intent.toHex._id,
            toHexLocation: intent.toHex.location,
            fromHexId: intent.unit.hexId,
            fromHexLocation: intent.unit.location,
          },
        );

        return; // Exit this specific move intent
      }

      UnitManager.moveUnit(intent.unit, intent.fromHex, intent.toHex, mpCost);

      // Stop if path done or out of gas
      if (
        intent.unit.movement.path.length === 0 ||
        intent.unit.state.mp === 0
      ) {
        intent.unit.state.status = UnitStatus.IDLE;
      }

      // Update Working Set
      context.unitLocations.delete(intent.fromCoordId);
      context.unitLocations.set(intent.toCoordId, intent.unit);

      // Update Hexes: Capture New
      handleHexCapture(context, intent.toHex, intent.unit);
    };

    const processUnitMovementBounce = (intent: MoveIntent) => {
      // Apply the MP movement cost (even though the unit won't actually move)
      const toHex = context.hexLookup.get(intent.toCoordId)!;
      const mpCost = MapUtils.getHexMPCost(toHex, intent.unit.playerId);

      intent.unit.state.mp = Math.max(0, intent.unit.state.mp - mpCost); // Reduce MP
      intent.unit.movement.path = []; // Clear the path

      // TODO: Unsure as to whether suppression when bouncing is too strong so
      // I've set up a constant for it if we need to tweak it.
      if (CONSTANTS.UNIT_STEP_BOUNCE_SUPPRESSION > 0) {
        intent.unit.steps = UnitManager.suppressSteps(
          intent.unit.steps,
          CONSTANTS.UNIT_STEP_BOUNCE_SUPPRESSION,
        ); // Take damage
      }

      // Set the unit to regrouping at the end of the tick (disorganised from forced stop)
      context.postTickRegroupingUnits.set(String(intent.unit._id), intent.unit);

      context.appendGameEvent(
        intent.unit.playerId, // Owner of the unit
        GameEventTypes.UNIT_MOVEMENT_BOUNCED,
        {
          unitId: intent.unit._id,
          catalogId: intent.unit.catalogId,
          toHexId: toHex._id,
          toHexLocation: toHex.location,
          fromHexId: intent.unit.hexId,
          fromHexLocation: intent.unit.location,
        },
      );
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
        const sortedIntents = intents.sort((a, b) => {
          return SORT_UNITS_BY_INITIATIVE(a.unit, b.unit);
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
        !context.stationsToRemove.some((id) => String(id) === String(s._id)),
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
        liveStations,
      );

      const playerUnits = liveUnits.filter(
        (u) => String(u.playerId) === playerIdStr,
      );

      playerUnits.forEach((unit) => {
        // Update the unit's supply status
        unit.supply = SupplyEngine.processTickSupplyTarget(
          unit.supply,
          unit.location,
          supplyNetwork,
        );
      });
    });
  },

  processPlayerDefeatedCheck(context: TickContext) {
    // Find players who do not have any planets or units, these
    // players have been defeated by conquest.
    const defeatedPlayers = context.players.filter((player) => {
      if (player.status === PlayerStatus.DEFEATED) {
        return false; // Already defeated.
      }

      const totalPlanets = context.planets.filter(
        (p) => p.playerId && String(p.playerId) === String(player._id),
      ).length;

      const totalUnits = context.units.filter(
        (u) =>
          String(u.playerId) === String(player._id) &&
          UnitManager.unitIsAlive(u),
      ).length;

      return totalPlanets === 0 && totalUnits === 0;
    });

    defeatedPlayers.forEach((p) => {
      p.status = PlayerStatus.DEFEATED;
      p.defeatedDate = new Date();
      p.isAIControlled = true;
    });
  },

  processTickWinnerCheck(context: TickContext) {
    let winnerPlayer: Player | null = null;

    // --- VICTORY BY LAST MAN STANDING CHECK ---
    // Filter active players (Not defeated)
    const activePlayers = context.players.filter(
      (p) => p.status !== PlayerStatus.DEFEATED,
    );

    if (activePlayers.length === 1) {
      winnerPlayer = activePlayers[0]!;
    }

    if (!winnerPlayer) {
      // --- VICTORY BY VP CHECK ---
      // Note: If all players are defeated or afk then let's just end the game now.
      const defeatedOrAFKPlayerCount = context.players.filter(
        (p) =>
          p.status === PlayerStatus.DEFEATED || p.status === PlayerStatus.AFK,
      ).length;

      const isAllPlayersDefeatedOrAFK =
        defeatedOrAFKPlayerCount === context.game.settings.playerCount;

      if (winnerPlayer == null || isAllPlayersDefeatedOrAFK) {
        winnerPlayer =
          GameLeaderboardUtils.getLeaderboard(
            context.players,
            context.planets,
            context.units,
          ).filter(
            (x) =>
              x.status === PlayerStatus.ACTIVE &&
              x.victoryPoints >= context.game.settings.victoryPointsToWin,
          )[0] ?? null;
      }
    }

    if (winnerPlayer) {
      context.winnerPlayerId = winnerPlayer._id;
      context.game.state.winnerPlayerId = winnerPlayer._id;
      context.game.state.status = GameStates.COMPLETED;
      context.game.state.endDate = new Date();

      context.appendGameEvent(null, GameEventTypes.GAME_COMPLETED, {
        winnerPlayer: {
          _id: winnerPlayer._id,
          alias: winnerPlayer.alias,
          color: winnerPlayer.color,
        },
      });
    }
  },

  processHexRadiationStorms(context: TickContext) {
    // ----- RADIATION STORMS -----
    // Units in radiation storms suffer 1 step suppression.
    const hexes = context.hexes.filter(
      (hex) =>
        hex.unitId != null && hex.terrain === TerrainTypes.RADIATION_STORM,
    );

    for (const hex of hexes) {
      const unit = context.units.find(
        (u) => String(u._id) === String(hex.unitId),
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
      UnitManager.addUnitHexZOC(unit, context.hexLookup);
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
        (u) => UnitManager.unitIsAlive(u),
      )
      .filter((u) => {
        // Unit must have active scout specialist to do this.
        const hasActiveScoutStep =
          UnitManager.getActiveSpecialistSteps(u).filter((s: UnitStep) => {
            const spec = SPECIALIST_STEP_ID_MAP.get(s.specialistId!)!;

            return spec.type === SpecialistStepTypes.SCOUTS; // Active spec step is a scouts type
          }).length > 0;

        return UnitManager.unitHasZOCInfluence(u) && hasActiveScoutStep;
      });

    for (const unit of scoutUnits) {
      const zocHexes = UnitManager.getUnitHexZOC(unit, context.hexLookup);

      for (const hex of zocHexes) {
        // Scouts cannot capture planets or stations and cannot capture if the hex
        // is already occupied by another unit.
        if (
          hex.unitId != null ||
          hex.planetId != null ||
          hex.stationId != null ||
          MapUtils.isHexImpassable(hex)
        ) {
          continue;
        }

        // No need to do this if the player already owns the hex.
        if (hex.playerId && String(hex.playerId) === String(unit.playerId)) {
          continue;
        }

        // If the hex is being influenced by this player only, then the player will gain control of the hex.
        const zocPlayers = [
          ...new Set(hex.zoc.map((z: HexZOCEntry) => String(z.playerId))),
        ];

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
        (u) => String(u.playerId) === playerIdStr,
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
            HexUtils.getCoordsID(unit.location),
          )!;
          hex.unitId = null;

          context.appendGameEvent(
            unit.playerId, // Owner of the unit
            GameEventTypes.UNIT_STARVED_BY_OOS,
            {
              unitId: unit._id,
              catalogId: unit.catalogId,
              hexId: unit.hexId,
              location: unit.location,
            },
          );
        }
      });

      // --- ECONOMY PHASE ---
      const ownedPlanets = context.planets.filter(
        (p) => String(p.playerId) === playerIdStr,
      );

      // Calculate Prestige Income
      const income = PlanetUtils.calculatePrestigeIncome(ownedPlanets);
      const newPrestige = player.prestigePoints + income;

      // Calculate Victory Points (Accumulated per cycle)
      const vpIncome = PlanetUtils.calculateVPIncome(ownedPlanets);
      const newVP = player.victoryPoints + vpIncome;

      player.prestigePoints = newPrestige;
      player.victoryPoints = newVP;

      context.appendGameEvent(
        player._id,
        GameEventTypes.PLAYER_CYCLE_COMPLETED,
        {
          newPrestige,
          newVP,
        },
      );
    });

    context.appendGameEvent(null, GameEventTypes.GAME_CYCLE_COMPLETED, {
      players: context.players
        .map((p) => ({
          _id: p._id,
          alias: p.alias,
          color: p.color,
          newVP: p.victoryPoints,
        }))
        .sort((a, b) => b.newVP - a.newVP), // Sort by new vp descending
    });
  },

  validatePreTickState(context: TickContext) {
    // ----- UNIT COMBAT VALIDATION -----
    // Validate that units preparing to fight are in a valid state and follow the game rules.
    const attackers = context.units.filter(
      (u) => u.state.status === UnitStatus.PREPARING,
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
        HexUtils.getCoordsID(unit.combat.location),
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
        HexUtils.getCoordsID(unit.combat.location),
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
            ERROR_CODES.UNIT_MUST_HAVE_ACTIVE_ARTILLERY_SPECIALIST,
          );
        }
      }
    }

    // ----- UNIT MOVEMENT VALIDATION -----
    // Validate the units preparing to move are in a valid state and follow the game rules.
    const movers = context.units.filter(
      (u) => u.state.status === UnitStatus.MOVING,
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
