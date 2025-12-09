import { ClientSession, Db, ObjectId } from "mongodb";
import {
  CONSTANTS,
  Game,
  GameStates,
  Player,
  PlayerStatus,
} from "@solaris-command/core";
import { UnitService } from "./UnitService";
import { StationService } from "./StationService";
import { PlanetService } from "./PlanetService";
import { HexService } from "./HexService";

export class PlayerService {
  static async getByGameId(db: Db, gameId: ObjectId) {
    return db.collection<Player>("players").find({ gameId }).toArray();
  }
  static async getByGameAndUserId(db: Db, gameId: ObjectId, userId: ObjectId) {
    return db.collection<Player>("players").findOne({
      gameId: gameId,
      userId: userId,
    });
  }

  static async findActivePlayersForUser(db: Db, userId: ObjectId) {
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

  static async findPendingPlayersForUser(db: Db, userId: ObjectId) {
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

  static async deductPrestigePoints(
    db: Db,
    playerId: ObjectId,
    prestige: number,
    session?: ClientSession
  ) {
    await db
      .collection("players")
      .updateOne(
        { _id: playerId },
        { $inc: { prestigePoints: -prestige } },
        { session }
      );
  }

  static async joinGame(
    db: Db,
    gameId: ObjectId,
    userId: ObjectId,
    options: { alias?: string; color?: string },
    session?: ClientSession
  ) {
    const newPlayer: Player = {
      _id: new ObjectId(),
      gameId,
      userId,
      alias: options.alias || "Unknown",
      color: options.color || "#FF0000",
      status: PlayerStatus.ACTIVE,
      prestigePoints: CONSTANTS.GAME_STARTING_PRESTIGE_POINTS,
      victoryPoints: 0,
      lastSeenDate: new Date(),
    };

    await db.collection("players").insertOne(newPlayer, { session });
    return newPlayer;
  }

  static async removePlayerAssets(
    db: Db,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    // Delete units
    await UnitService.deleteByPlayerId(db, playerId, session);
    // Delete stations
    await StationService.deleteByPlayerId(db, playerId, session);
    // Remove planet ownerships
    await PlanetService.removeOwnership(db, playerId, session);
    // Remove hex ownerships
    await HexService.removeOwnership(db, playerId, session);
  }

  static async leaveGame(db: Db, playerId: ObjectId, session?: ClientSession) {
    const result = await db
      .collection("players")
      .deleteOne({ _id: playerId }, { session });

    return result;
  }

  static async concedeGame(
    db: Db,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    // Update player status to DEFEATED
    const result = await db.collection("players").updateOne(
      {
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
    db: Db,
    playerId: ObjectId,
    status: PlayerStatus,
    session?: ClientSession
  ) {
    return db
      .collection("players")
      .updateOne({ _id: playerId }, { $set: { status } }, { session });
  }

  static async touchPlayer(db: Db, playerId: ObjectId) {
    return db.collection("players").updateOne(
      { _id: playerId },
      {
        $set: {
          lastSeenDate: new Date(),
        },
      }
    );
  }
}
