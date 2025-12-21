import { ClientSession, Types } from "mongoose";
import { GameStates } from "@solaris-command/core";
import { GameModel } from "../db/schemas/game";
import { PlayerModel } from "../db/schemas/player";
import { GameEventModel } from "../db/schemas/game-event";

export class GameService {
  static async getById(gameId: Types.ObjectId) {
    return GameModel.findById(gameId);
  }

  static async listGamesByUser(userId: Types.ObjectId) {
    // 1. Find games where user is a player
    const myPlayers = await PlayerModel.find({ userId });

    const myGameIds = myPlayers.map((p) => p.gameId);

    // 2. Query Games
    const games = await GameModel.find({
      $or: [
        { _id: { $in: myGameIds } },
        { "state.status": GameStates.PENDING },
      ],
    })
      .sort({ "state.startDate": -1 })
      .limit(50);

    return { games, myGameIds };
  }

  static async createGame(gameData: any, session?: ClientSession) {
    const game = new GameModel(gameData);
    await game.save({ session });
    return game;
  }

  static async getGameEvents(gameId: Types.ObjectId) {
    return GameEventModel.find({ gameId })
      .sort({ createdAt: -1 })
      .limit(100);
  }

  static async lockGame(gameId: Types.ObjectId) {
    return GameService.updateGameState(gameId, {
      "state.status": GameStates.LOCKED,
    });
  }

  static async unlockGame(gameId: Types.ObjectId) {
    return GameService.updateGameState(gameId, {
      "state.status": GameStates.ACTIVE,
    });
  }

  static async updateGameState(
    gameId: Types.ObjectId,
    update: any,
    session?: ClientSession
  ) {
    return GameModel.updateOne({ _id: gameId }, { $set: update }, { session });
  }

  static async incrementPlayerCount(
    gameId: Types.ObjectId,
    session?: ClientSession
  ) {
    return GameModel.findOneAndUpdate(
      { _id: gameId },
      { $inc: { "state.playerCount": 1 } },
      { session, new: true } // new: true returns the modified document
    );
  }
}
