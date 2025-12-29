import {
  GameGalaxyResponseSchema,
  GameStates,
  HexCoords,
  UnifiedId,
  UnitManager,
} from "@solaris-command/core";
import { GameGalaxy } from "../services/GameGalaxyService";

export class GameGalaxyMapper {
  static toGameGalaxyResponse(
    galaxy: GameGalaxy,
    userPlayerId: UnifiedId | null // Will mask data based on the perspective of this player.
  ): GameGalaxyResponseSchema {
    // Mask a field if the player id does not match.
    const tryMaskField = (playerId: UnifiedId, value: any) => {
      // Do not mask for completed games.
      if (galaxy.game.state.status === GameStates.COMPLETED) {
        return value;
      }

      // Always mask for spectators.
      if (userPlayerId == null) {
        return null;
      }

      if (String(userPlayerId) === String(playerId)) {
        return value;
      }

      // Mask
      return null;
    };

    // Masks movement paths so that a player can only
    // see the next upcoming movement of enemy units.
    const tryMaskMovementPath = (
      playerId: UnifiedId,
      path: HexCoords[]
    ): HexCoords[] => {
      // Do not mask for completed games.
      if (galaxy.game.state.status === GameStates.COMPLETED) {
        return path;
      }

      // Always mask for spectators.
      if (userPlayerId == null) {
        return [];
      }

      if (path.length === 0 || String(userPlayerId) === String(playerId)) {
        return path;
      }

      // Return the first one only (masked)
      return [path[0]];
    };

    return {
      game: {
        _id: String(galaxy.game._id),
        mapId: galaxy.game.mapId,
        name: galaxy.game.name,
        description: galaxy.game.description,
        state: {
          status: galaxy.game.state.status,
          playerCount: galaxy.game.state.playerCount,
          tick: galaxy.game.state.tick,
          cycle: galaxy.game.state.cycle,
          createdDate: galaxy.game.state.createdDate.toISOString(),
          startDate: galaxy.game.state.startDate?.toISOString() || null,
          endDate: galaxy.game.state.endDate?.toISOString() || null,
          lastTickDate: galaxy.game.state.lastTickDate?.toISOString() || null,
          winnerPlayerId: galaxy.game.state.winnerPlayerId?.toString() || null,
        },
        settings: {
          playerCount: galaxy.game.settings.playerCount,
          ticksPerCycle: galaxy.game.settings.ticksPerCycle,
          tickDurationMS: galaxy.game.settings.tickDurationMS,
          victoryPointsToWin: galaxy.game.settings.victoryPointsToWin,
        },
      },
      players: galaxy.players.map((p) => ({
        _id: String(p._id),
        gameId: String(p.gameId),
        userId:
          String(userPlayerId) === String(p._id) ? String(p.userId) : null,
        alias: p.alias,
        color: p.color,
        status: p.status,
        prestigePoints: tryMaskField(p._id, p.prestigePoints),
        victoryPoints: p.victoryPoints,
        lastSeenDate: p.lastSeenDate.toISOString(),
        renownToDistribute: p.renownToDistribute,
      })),
      hexes: galaxy.hexes.map((h) => ({
        _id: String(h._id),
        gameId: String(h.gameId),
        playerId: h.playerId?.toString() || null,
        planetId: h.planetId?.toString() || null,
        stationId: h.stationId?.toString() || null,
        unitId: h.unitId?.toString() || null,
        location: h.location,
        terrain: h.terrain,
        zoc: h.zoc.map((z) => ({
          playerId: z.playerId.toString(),
          unitId: z.unitId.toString(),
        })),
      })),
      planets: galaxy.planets.map((p) => ({
        _id: String(p._id),
        gameId: String(p.gameId),
        playerId: p.playerId?.toString() || null,
        hexId: String(p.hexId),
        location: p.location,
        name: p.name,
        isCapital: p.isCapital,
        supply: {
          isInSupply: p.supply.isInSupply,
          isRoot: p.supply.isRoot,
        },
      })),
      stations: galaxy.stations.map((s) => ({
        _id: String(s._id),
        gameId: String(s.gameId),
        playerId: String(s.playerId),
        hexId: String(s.hexId),
        location: s.location,
        supply: {
          isInSupply: s.supply.isInSupply,
          isRoot: s.supply.isRoot,
        },
      })),
      units: galaxy.units.map((u) => ({
        _id: String(u._id),
        gameId: String(u.gameId),
        playerId: String(u.playerId),
        catalogId: u.catalogId,
        hexId: String(u.hexId),
        location: u.location,
        steps: u.steps.map((s) => ({
          isSuppressed: s.isSuppressed,
          specialistId: s.specialistId,
        })),
        state: {
          status: u.state.status,
          ap: u.state.ap,
          mp: u.state.mp,
          activeSteps: UnitManager.getActiveSteps(u).length,
          suppressedSteps: UnitManager.getSuppressedSteps(u).length,
        },
        movement: {
          path: tryMaskMovementPath(u.playerId, u.movement.path),
        },
        combat: {
          // Note: Masking combat location is not needed since combat triggers at the end of the tick.
          hexId: u.combat.hexId ? String(u.combat.hexId) : null,
          location: u.combat.location,
          operation: tryMaskField(u.playerId, u.combat.operation),
          advanceOnVictory: tryMaskField(u.playerId, u.combat.advanceOnVictory),
        },
        supply: {
          isInSupply: u.supply.isInSupply,
          ticksLastSupply: u.supply.ticksLastSupply,
          ticksOutOfSupply: u.supply.ticksOutOfSupply,
        },
      })),
    };
  }
}
