import { ClientSession, Types } from "mongoose";
import { Planet } from "@solaris-command/core";
import { PlanetModel } from "../db/schemas/planet";

export class PlanetService {
  static async removeOwnership(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    session?: ClientSession
  ) {
    return PlanetModel.updateMany(
      { gameId, playerId },
      { $set: { playerId: null } },
      { session }
    );
  }

  static async getByGameId(gameId: Types.ObjectId) {
    return PlanetModel.find({ gameId });
  }

  static async insertPlanets(planets: Planet[], session?: ClientSession) {
    await PlanetModel.insertMany(planets, { session });
  }

  static async assignPlanetToPlayer(
    gameId: Types.ObjectId,
    planetId: Types.ObjectId,
    playerId: Types.ObjectId,
    session?: ClientSession
  ) {
    return PlanetModel.updateOne(
      { gameId, _id: planetId },
      { $set: { playerId } },
      { session }
    );
  }
}
