import { ClientSession, ObjectId } from "mongodb";
import { Planet } from "@solaris-command/core";
import { getDb } from "../db/instance";

export class PlanetService {
  static async removeOwnership(playerId: ObjectId, session?: ClientSession) {
    const db = getDb();
    return db.collection<Planet>("planets").updateMany(
      { playerId },
      { $set: { playerId: null } },
      { session }
    );
  }

  static async getByGameId(gameId: ObjectId) {
    const db = getDb();
    return db.collection<Planet>("planets").find({ gameId }).toArray();
  }
}
