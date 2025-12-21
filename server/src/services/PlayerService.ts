import { ClientSession, Types } from "mongoose";
import {
  CONSTANTS,
  GameStates,
  Player,
  PlayerStatus,
} from "@solaris-command/core";
import { UnitService } from "./UnitService";
import { StationService } from "./StationService";
import { PlanetService } from "./PlanetService";
import { HexService } from "./HexService";
import { PlayerModel } from "../db/schemas/player";
import { GameModel } from "../db/schemas/game";

export class PlayerService {
  static async getByGameId(gameId: Types.ObjectId) {
    return PlayerModel.find({ gameId });
  }

  static async getByGameAndUserId(gameId: Types.ObjectId, userId: Types.ObjectId) {
    return PlayerModel.findOne({
      gameId: gameId,
      userId: userId,
    });
  }

  static async getByGameAndPlayerId(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId
  ) {
    return PlayerModel.findOne({
      gameId: gameId,
      _id: playerId,
    });
  }

  static async findActivePlayersForUser(userId: Types.ObjectId) {
    const activeGames = await GameModel.find({ "state.status": GameStates.ACTIVE });

    return PlayerModel.find({
      gameId: { $in: activeGames.map((g) => g._id) },
      userId,
      status: PlayerStatus.ACTIVE,
    });
  }

  static async findPendingPlayersForUser(userId: Types.ObjectId) {
    const pendingGames = await GameModel.find({ "state.status": GameStates.PENDING });

    return PlayerModel.find({
      gameId: { $in: pendingGames.map((g) => g._id) },
      userId,
      status: PlayerStatus.ACTIVE,
    });
  }

  static async incrementPrestigePoints(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
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
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    prestige: number,
    session?: ClientSession
  ) {
    await PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $inc: { prestigePoints: -prestige } },
      { session }
    );
  }

  static async joinGame(
    gameId: Types.ObjectId,
    userId: Types.ObjectId,
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
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    session?: ClientSession
  ) {
    // Delete units
    await UnitService.deleteByPlayerId(gameId, playerId, session);
    // Remove player ZOC influence
    await HexService.removeAllPlayerZOC(gameId, playerId, session);
    // Delete stations
    await StationService.deleteByPlayerId(gameId, playerId, session);
    // Remove planet ownerships
    await PlanetService.removeOwnership(gameId, playerId, session);
    // Remove hex ownerships
    await HexService.removeOwnership(gameId, playerId, session);
  }

  static async leaveGame(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    session?: ClientSession
  ) {
    const result = await PlayerModel.deleteOne(
      { gameId, _id: playerId },
      { session }
    );

    return result;
  }

  static async concedeGame(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
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
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    status: PlayerStatus,
    session?: ClientSession
  ) {
    return PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $set: { status } },
      { session }
    );
  }

  static async touchPlayer(gameId: Types.ObjectId, playerId: Types.ObjectId) {
    return PlayerModel.updateOne(
      { gameId, _id: playerId },
      {
        $set: {
          lastSeenDate: new Date(),
        },
      }
    );
  }
}
