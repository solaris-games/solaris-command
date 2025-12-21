import { ClientSession, Types } from "mongoose";
import { Planet, UnifiedId } from "@solaris-command/core";
import { PlanetModel } from "../db/schemas/planet";

export class PlanetService {
  static async removeOwnership(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    return PlanetModel.updateMany(
      { gameId, playerId },
      { $set: { playerId: null } },
      { session }
    );
  }

  static async getByGameId(gameId: UnifiedId) {
    return PlanetModel.find({ gameId });
  }

  static async insertPlanets(planets: Planet[], session?: ClientSession) {
    await PlanetModel.insertMany(planets, { session });
  }

  static async assignPlanetToPlayer(
    gameId: UnifiedId,
    planetId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    return PlanetModel.updateOne(
      { gameId, _id: planetId },
      { $set: { playerId } },
      { session }
    );
  }
}
