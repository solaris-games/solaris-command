import { ClientSession, Db, ObjectId } from "mongodb";
import { Planet } from "@solaris-command/core";

export class PlanetService {
  static async removeOwnership(
    db: Db,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Planet>("planets")
      .updateMany({ playerId }, { $set: { playerId: null } }, { session });
  }

  static async getByGameId(db: Db, gameId: ObjectId) {
    return db.collection<Planet>("planets").find({ gameId }).toArray();
  }

  static async insertPlanets(db: Db, planets: Planet[]) {
    await db.collection<Planet>("planets").insertMany(planets);
  }

  static async assignPlanetToPlayer(
    db: Db,
    planetId: ObjectId,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Planet>("planets")
      .updateOne({ _id: planetId }, { $set: { playerId } }, { session });
  }
}
