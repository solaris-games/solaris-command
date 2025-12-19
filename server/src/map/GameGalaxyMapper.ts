import {
  GameGalaxyResponseSchema,
  GameStates,
  HexCoords,
  UnitManager,
} from "@solaris-command/core";
import { GameGalaxy } from "../services/GameGalaxyService";
import { ObjectId } from "mongodb";

export class GameGalaxyMapper {
  static toGameGalaxyResponse(
    galaxy: GameGalaxy,
    userPlayerId: ObjectId | null // Will mask data based on the perspective of this player.
  ): GameGalaxyResponseSchema {
    // Mask a field if the player id does not match.
    const tryMaskField = (playerId: ObjectId, value: any) => {
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
    const tryMaskMovementPath = (playerId: ObjectId, path: HexCoords[]): HexCoords[] => {
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

      // Return the first one only (mask)
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
        alias: p.alias,
        color: p.color,
        status: p.status,
        prestigePoints: tryMaskField(p._id, p.prestigePoints),
        victoryPoints: p.victoryPoints,
        lastSeenDate: p.lastSeenDate.toISOString(),
        isUserPlayer: String(userPlayerId) === String(p.userId)
      })),
      hexes: galaxy.hexes.map((h) => ({
        _id: String(h._id),
        playerId: h.playerId?.toString() || null,
        planetId: h.planetId?.toString() || null,
        stationId: h.stationId?.toString() || null,
        unitId: h.unitId?.toString() || null,
        location: h.location,
        terrain: h.terrain
      })),
      planets: galaxy.planets.map((p) => ({
        _id: String(p._id),
        playerId: p.playerId?.toString() || null,
        name: p.name,
        hexId: String(p.hexId),
        location: p.location,
        supply: {
          isInSupply: p.supply.isInSupply,
          isRoot: p.supply.isRoot,
        },
        isCapital: p.isCapital,
      })),
      stations: galaxy.stations.map((s) => ({
        _id: String(s._id),
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
          suppressedSteps: UnitManager.getSuppressedSteps(u).length
        },
        movement: {
          path: tryMaskMovementPath(u.playerId, u.movement.path),
        },
        combat: {
          // Note: Masking combat location is not needed since combat triggers at the end of the tick.
          location: u.combat.location || null,
          operation: tryMaskField(u.playerId, u.combat.operation),
          advanceOnVictory: tryMaskField(u.playerId, u.combat.advanceOnVictory)
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
