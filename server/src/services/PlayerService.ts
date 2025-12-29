import { ClientSession, Types } from "mongoose";
import {
  CONSTANTS,
  GameStates,
  Player,
  PlayerStatus,
  UnifiedId,
} from "@solaris-command/core";
import { UnitService } from "./UnitService";
import { StationService } from "./StationService";
import { PlanetService } from "./PlanetService";
import { HexService } from "./HexService";
import { PlayerModel } from "../db/schemas/player";
import { GameModel } from "../db/schemas/game";

export class PlayerService {
  static async getByGameId(gameId: UnifiedId) {
    return PlayerModel.find({ gameId });
  }

  static async getByGameAndUserId(gameId: UnifiedId, userId: UnifiedId) {
    return PlayerModel.findOne({
      gameId: gameId,
      userId: userId,
    });
  }

  static async getByGameAndPlayerId(gameId: UnifiedId, playerId: UnifiedId) {
    return PlayerModel.findOne({
      gameId: gameId,
      _id: playerId,
    });
  }

  static async findActivePlayersForUser(userId: UnifiedId) {
    const activeGames = await GameModel.find({
      "state.status": GameStates.ACTIVE,
    });

    return PlayerModel.find({
      gameId: { $in: activeGames.map((g) => g._id) },
      userId,
      status: PlayerStatus.ACTIVE,
    });
  }

  static async findPendingPlayersForUser(userId: UnifiedId) {
    const pendingGames = await GameModel.find({
      "state.status": GameStates.PENDING,
    });

    return PlayerModel.find({
      gameId: { $in: pendingGames.map((g) => g._id) },
      userId,
      status: PlayerStatus.ACTIVE,
    });
  }

  static async incrementPrestigePoints(
    gameId: UnifiedId,
    playerId: UnifiedId,
    prestige: number,
    session?: ClientSession
  ) {
    await PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $inc: { prestigePoints: prestige } },
      { session }
    );
  }

  static async deductPrestigePoints(
    gameId: UnifiedId,
    playerId: UnifiedId,
    prestige: number,
    session?: ClientSession
  ) {
    await PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $inc: { prestigePoints: -prestige } },
      { session }
    );
  }

  static async deductRenownToDistrubute(
    gameId: UnifiedId,
    playerId: UnifiedId,
    renown: number,
    session?: ClientSession
  ) {
    await PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $inc: { renownToDistribute: -renown } },
      { session }
    );
  }

  static async joinGame(
    gameId: UnifiedId,
    userId: UnifiedId,
    options: { alias?: string; color?: string },
    session?: ClientSession
  ) {
    const newPlayer = new PlayerModel({
      gameId,
      userId,
      alias: options.alias || "Unknown",
      color: options.color || "#FF0000",
      status: PlayerStatus.ACTIVE,
      prestigePoints: CONSTANTS.GAME_STARTING_PRESTIGE_POINTS,
      victoryPoints: 0,
      lastSeenDate: new Date(),
    });

    await newPlayer.save({ session });
    return newPlayer;
  }

  static async removePlayerAssets(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    // Delete units
    await UnitService.deleteByPlayerId(gameId, playerId, session);
    // Remove unit references on hexes
    await HexService.removePlayerUnits(gameId, playerId, session);
    // Remove player ZOC influence
    await HexService.removeAllPlayerZOC(gameId, playerId, session);
    // Delete stations
    await StationService.deleteByPlayerId(gameId, playerId, session);
    // Remove station references on hexes
    await HexService.removePlayerStations(gameId, playerId, session);
    // Remove planet ownerships
    await PlanetService.removePlayerOwnership(gameId, playerId, session);
    // Remove hex ownerships
    await HexService.removePlayerOwnership(gameId, playerId, session);
  }

  static async leaveGame(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    const result = await PlayerModel.deleteOne(
      { gameId, _id: playerId },
      { session }
    );

    return result;
  }

  static async concedeGame(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    // Update player status to DEFEATED
    const result = await PlayerModel.updateOne(
      {
        gameId,
        _id: playerId,
      },
      {
        $set: { status: PlayerStatus.DEFEATED },
      },
      { session }
    );
    return result;
  }

  static async setStatus(
    gameId: UnifiedId,
    playerId: UnifiedId,
    status: PlayerStatus,
    session?: ClientSession
  ) {
    return PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $set: { status } },
      { session }
    );
  }

  static async touchPlayer(gameId: UnifiedId, player: Player) {
    return PlayerModel.updateOne(
      { gameId, _id: player._id },
      {
        $set: {
          lastSeenDate: new Date(),
          status:
            player.status === PlayerStatus.AFK
              ? PlayerStatus.ACTIVE
              : player.status,
        },
      }
    );
  }
}
