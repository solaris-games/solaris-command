import { ClientSession, Types } from "mongoose";
import {
  CONSTANTS,
  GameStates,
  Player,
  PlayerFactory,
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
  static async getByGameIdLean(gameId: UnifiedId) {
    return PlayerModel.find({ gameId }).lean();
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

  static async isAliasTaken(
    gameId: UnifiedId,
    alias: string,
  ): Promise<boolean> {
    const existingPlayer = await PlayerModel.findOne({
      gameId: gameId,
      alias: { $regex: new RegExp(`^${alias}$`, "i") },
    });
    return !!existingPlayer;
  }

  static async findActivePlayersForUser(userId: UnifiedId) {
    const activeGames = await GameModel.find({
      "state.status": {
        $in: [GameStates.ACTIVE, GameStates.STARTING],
      },
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
    session?: ClientSession,
  ) {
    await PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $inc: { prestigePoints: prestige } },
      { session },
    );
  }

  static async deductPrestigePoints(
    gameId: UnifiedId,
    playerId: UnifiedId,
    prestige: number,
    session?: ClientSession,
  ) {
    await PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $inc: { prestigePoints: -prestige } },
      { session },
    );
  }

  static async deductRenownToDistrubute(
    gameId: UnifiedId,
    playerId: UnifiedId,
    renown: number,
    session?: ClientSession,
  ) {
    await PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $inc: { renownToDistribute: -renown } },
      { session },
    );
  }

  static async joinGame(
    gameId: UnifiedId,
    userId: UnifiedId,
    options: { alias?: string; color?: string; renownToDistribute: number },
    session?: ClientSession,
  ) {
    const player = PlayerFactory.create(
      gameId,
      userId,
      options.alias || "Unknown",
      options.color || "#FF0000",
      options.renownToDistribute,
      () => new Types.ObjectId(),
    );

    const model = new PlayerModel(player);

    await model.save({ session });
    return model;
  }

  static async removePlayerAssets(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession,
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
    session?: ClientSession,
  ) {
    const result = await PlayerModel.deleteOne(
      { gameId, _id: playerId },
      { session },
    );

    return result;
  }

  static async concedeGame(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession,
  ) {
    // Update player status to DEFEATED
    const result = await PlayerModel.updateOne(
      {
        gameId,
        _id: playerId,
      },
      {
        $set: {
          status: PlayerStatus.DEFEATED,
          isAIControlled: true,
        },
      },
      { session },
    );
    return result;
  }

  static async setStatus(
    gameId: UnifiedId,
    playerId: UnifiedId,
    status: PlayerStatus,
    session?: ClientSession,
  ) {
    return PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $set: { status } },
      { session },
    );
  }

  static async setReadyStatus(
    gameId: UnifiedId,
    playerId: UnifiedId,
    isReady: boolean,
    session?: ClientSession,
  ) {
    return PlayerModel.updateOne(
      { gameId, _id: playerId },
      { $set: { isReady } },
      { session },
    );
  }

  static async resetReadyStatus(gameId: UnifiedId, session?: ClientSession) {
    return PlayerModel.updateOne(
      { gameId, status: PlayerStatus.ACTIVE },
      { $set: { isReady: false } },
      { session },
    );
  }

  static async touchPlayer(gameId: UnifiedId, player: Player) {
    let newStatus = player.status;
    let newIsAIControlled = player.isAIControlled;

    // If the player is currently AFK then touching them
    // should make them active again and not controlled by AI.
    if (player.status === PlayerStatus.AFK) {
      newStatus = PlayerStatus.ACTIVE;
      newIsAIControlled = false;
    }

    return PlayerModel.updateOne(
      {
        gameId,
        _id: player._id,
        "state.status": { $ne: GameStates.LOCKED }, // Do not update locked games due to concurrency issues
      },
      {
        $set: {
          lastSeenDate: new Date(),
          status: newStatus,
          isAIControlled: newIsAIControlled,
        },
      },
    );
  }

  static async countActivePlayers(gameId: UnifiedId, session?: ClientSession) {
    return PlayerModel.countDocuments(
      {
        gameId,
        status: PlayerStatus.ACTIVE,
      },
      session,
    );
  }

  static async countReadyPlayers(gameId: UnifiedId, session?: ClientSession) {
    return PlayerModel.countDocuments(
      {
        gameId,
        isReady: true,
      },
      session,
    );
  }
}
