import { ClientSession, Db, ObjectId } from "mongodb";
import { Game, GameStates, Player, FogOfWar } from "@solaris-command/core";
import { UnitService } from "./UnitService";
import { StationService } from "./StationService";
import { PlanetService } from "./PlanetService";
import { HexService } from "./HexService";
import { PlayerService } from "./PlayerService";

export class GameService {
  static async getById(db: Db, gameId: ObjectId) {
    return db
      .collection<Game>("games")
      .findOne({ _id: new ObjectId(gameId) });
  }

  static async listGamesByUser(db: Db, userId: ObjectId) {
    // 1. Find games where user is a player
    const myPlayers = await db
      .collection<Player>("players")
      .find({ userId })
      .toArray();

    const myGameIds = myPlayers.map((p) => p.gameId);

    // 2. Query Games
    const games = await db
      .collection<Game>("games")
      .find({
        $or: [
          { _id: { $in: myGameIds } },
          { "state.status": GameStates.PENDING },
        ],
      })
      .sort({ "state.startDate": -1 })
      .limit(50)
      .toArray();

    return { games, myGameIds };
  }

  static async createGame(db: Db, gameData: any) {
    const result = await db.collection("games").insertOne(gameData);
    return { id: result.insertedId, ...gameData };
  }

  static async getGameEvents(db: Db, gameId: ObjectId) {
    return db
      .collection("game_events")
      .find({ gameId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
  }

  static async lockGame(db: Db, gameId: ObjectId) {
    return GameService.updateGameState(db, gameId, {
      "state.status": GameStates.ACTIVE,
    });
  }

  static async unlockGame(db: Db, gameId: ObjectId) {
    return GameService.updateGameState(db, gameId, {
      "state.status": GameStates.ACTIVE,
    });
  }

  static async updateGameState(
    db: Db,
    gameId: ObjectId,
    update: any,
    session?: ClientSession
  ) {
    return db
      .collection<Game>("games")
      .updateOne({ _id: gameId }, { $set: update }, { session });
  }

  static async incrementPlayerCount(
    db: Db,
    gameId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Game>("games")
      .findOneAndUpdate(
        { _id: gameId },
        { $inc: { "state.playerCount": 1 } },
        { session, returnDocument: "after" }
      );
  }
}
