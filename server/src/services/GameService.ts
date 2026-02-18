import { ClientSession, Types } from "mongoose";
import { Game, GameEvent, GameStates, UnifiedId } from "@solaris-command/core";
import { GameModel } from "../db/schemas/game";
import { PlayerModel } from "../db/schemas/player";
import { GameEventModel } from "../db/schemas/game-event";

export class GameService {
  static async getById(gameId: UnifiedId) {
    return GameModel.findById(gameId);
  }

  static async listGamesByUser(userId: UnifiedId) {
    // 1. Find games where user is a player
    const myPlayers = await PlayerModel.find({ userId }).lean();

    const myGameIds = myPlayers.map((p) => p.gameId as Types.ObjectId);

    // 2. Query Games
    const games = await GameModel.find({
      $or: [
        { _id: { $in: myGameIds } as any },
        { "state.status": GameStates.PENDING },
      ],
    })
      .limit(50)
      .lean();

    games.sort((a, b) => {
      if (a.state.startDate === null && b.state.startDate !== null) {
        return -1; // a (null) comes before b (non-null)
      }
      if (a.state.startDate !== null && b.state.startDate === null) {
        return 1; // b (null) comes before a (non-null)
      }
      if (a.state.startDate === null && b.state.startDate === null) {
        return 0; // Both null, maintain relative order
      }
      // Both non-null, sort descending
      return (
        (b.state.startDate as Date).getTime() -
        (a.state.startDate as Date).getTime()
      );
    });

    return { games, myGameIds };
  }

  static async createGame(gameData: Game, session?: ClientSession) {
    const game = new GameModel(gameData);
    await game.save({ session });
    return game;
  }

  static async createGameEvent(gameEvent: GameEvent, session?: ClientSession) {
    const model = new GameEventModel(gameEvent);
    await model.save({ session });
    return model;
  }

  static async getGameEvents(gameId: UnifiedId, playerId: UnifiedId) {
    return GameEventModel.find({
      gameId,
      $or: [
        {
          playerId: { $eq: null }, // Game events for everyone
        },
        {
          playerId: playerId,
        },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  static async startGame(gameId: UnifiedId) {
    return GameService.updateGameState(gameId, {
      "state.status": GameStates.ACTIVE,
    });
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
      session,
    );
  }

  static async updateGameState(
    gameId: UnifiedId,
    update: any,
    session?: ClientSession,
  ) {
    return GameModel.updateOne({ _id: gameId }, { $set: update }, { session });
  }

  static async addPlayerCount(gameId: UnifiedId, session?: ClientSession) {
    return GameModel.findOneAndUpdate(
      { _id: gameId },
      { $inc: { "state.playerCount": 1 } },
      { session, new: true }, // new: true returns the modified document
    );
  }

  static async deductPlayerCount(gameId: UnifiedId, session?: ClientSession) {
    return GameModel.findOneAndUpdate(
      { _id: gameId },
      { $inc: { "state.playerCount": -1 } },
      { session, new: true }, // new: true returns the modified document
    );
  }
}
