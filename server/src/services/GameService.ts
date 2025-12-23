import { ClientSession, Types } from "mongoose";
import { Game, GameStates, UnifiedId } from "@solaris-command/core";
import { GameModel } from "../db/schemas/game";
import { PlayerModel } from "../db/schemas/player";
import { GameEventModel } from "../db/schemas/game-event";

export class GameService {
  static async getById(gameId: UnifiedId) {
    return GameModel.findById(gameId);
  }

  static async listGamesByUser(userId: UnifiedId) {
    // 1. Find games where user is a player
    const myPlayers = await PlayerModel.find({ userId });

    const myGameIds = myPlayers.map((p) => p.gameId as Types.ObjectId);

    // 2. Query Games
    const games = await GameModel.find({
      $or: [
        { _id: { $in: myGameIds } as any },
        { "state.status": GameStates.PENDING },
      ],
    })
      .sort({ "state.startDate": -1 })
      .limit(50);

    return { games, myGameIds };
  }

  static async createGame(gameData: Game, session?: ClientSession) {
    const game = new GameModel(gameData);
    await game.save({ session });
    return game;
  }

  static async getGameEvents(gameId: UnifiedId) {
    return GameEventModel.find({ gameId }).sort({ createdAt: -1 }).limit(100);
  }

  static async lockGame(gameId: UnifiedId) {
    return GameService.updateGameState(gameId, {
      "state.status": GameStates.LOCKED,
    });
  }

  static async unlockGame(gameId: UnifiedId, session?: ClientSession) {
    return GameService.updateGameState(
      gameId,
      {
        "state.status": GameStates.ACTIVE,
      },
      session
    );
  }

  static async updateGameState(
    gameId: UnifiedId,
    update: any,
    session?: ClientSession
  ) {
    return GameModel.updateOne({ _id: gameId }, { $set: update }, { session });
  }

  static async addPlayerCount(gameId: UnifiedId, session?: ClientSession) {
    return GameModel.findOneAndUpdate(
      { _id: gameId },
      { $inc: { "state.playerCount": 1 } },
      { session, new: true } // new: true returns the modified document
    );
  }

  static async deductPlayerCount(gameId: UnifiedId, session?: ClientSession) {
    return GameModel.findOneAndUpdate(
      { _id: gameId },
      { $inc: { "state.playerCount": -1 } },
      { session, new: true } // new: true returns the modified document
    );
  }
}
