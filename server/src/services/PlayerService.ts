import { ClientSession, ObjectId } from "mongodb";
import {
  CONSTANTS,
  Game,
  GameStates,
  Player,
  PlayerStatus,
} from "@solaris-command/core";
import { getDb } from "../db/instance";
import { UnitService } from "./UnitService";
import { StationService } from "./StationService";
import { PlanetService } from "./PlanetService";
import { HexService } from "./HexService";

export class PlayerService {
  static async getByGameId(gameId: ObjectId) {
    const db = getDb();
    return db.collection<Player>("players").find({ gameId }).toArray();
  }

  static async findActivePlayersForUser(userId: ObjectId) {
    const db = getDb();
    const activeGames = await db
      .collection<Game>("games")
      .find({ "state.status": GameStates.ACTIVE })
      .toArray();

    return db
      .collection<Player>("players")
      .find({
        gameId: { $in: activeGames.map((g) => g._id) },
        userId,
        status: PlayerStatus.ACTIVE,
      })
      .toArray();
  }

  static async findPendingPlayersForUser(userId: ObjectId) {
    const db = getDb();
    const pendingGames = await db
      .collection<Game>("games")
      .find({ "state.status": GameStates.PENDING })
      .toArray();

    return db
      .collection<Player>("players")
      .find({
        gameId: { $in: pendingGames.map((g) => g._id) },
        userId,
        status: PlayerStatus.ACTIVE,
      })
      .toArray();
  }

  static async joinGame(
    gameId: ObjectId,
    userId: ObjectId,
    options: { username?: string; color?: string }
  ) {
    const db = getDb();

    const newPlayer: Player = {
      _id: new ObjectId(),
      gameId,
      userId,
      alias: options.username || "Unknown",
      color: options.color || "#FF0000",
      status: PlayerStatus.ACTIVE,
      prestigePoints: CONSTANTS.GAME_STARTING_PRESTIGE_POINTS,
      victoryPoints: 0,
      lastSeenDate: new Date(),
    };

    await db.collection("players").insertOne(newPlayer);
    return newPlayer;
  }

  static async removePlayerAssets(playerId: ObjectId, session?: ClientSession) {
    // Delete units
    await UnitService.deleteByPlayerId(playerId, session);
    // Delete stations
    await StationService.deleteByPlayerId(playerId, session);
    // Remove planet ownerships
    await PlanetService.removeOwnership(playerId, session);
    // Remove hex ownerships
    await HexService.removeOwnership(playerId, session);
  }

  static async leaveGame(
    gameId: ObjectId,
    userId: ObjectId,
    session?: ClientSession
  ) {
    const db = getDb();

    // Find the player first
    const player = await db.collection<Player>("players").findOne(
        { gameId, userId },
        { session }
    );

    if (!player) {
        throw new Error("Player not found in this game");
    }

    const result = await db.collection("players").deleteOne(
      { _id: player._id },
      { session }
    );

    if (result.deletedCount > 0) {
      await this.removePlayerAssets(player._id, session);
    }

    return result;
  }

  static async concedeGame(
    gameId: ObjectId,
    userId: ObjectId,
    session?: ClientSession
  ) {
    const db = getDb();
    // Update player status to DEFEATED
    const result = await db.collection("players").updateOne(
      {
        gameId,
        userId: userId, // userId is ObjectId in Player interface
      },
      {
        $set: { status: PlayerStatus.DEFEATED },
      },
      { session }
    );
    return result;
  }

  static async setStatus(
      playerId: ObjectId,
      status: PlayerStatus,
      session?: ClientSession
  ) {
      const db = getDb();
      return db.collection("players").updateOne(
          { _id: playerId },
          { $set: { status } },
          { session }
      );
  }
}
