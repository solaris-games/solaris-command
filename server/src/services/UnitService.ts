import { ClientSession, ObjectId } from "mongodb";
import { Unit } from "@solaris-command/core";
import { getDb } from "../db/instance";

export class UnitService {
  static async deleteByPlayerId(playerId: ObjectId, session?: ClientSession) {
    const db = getDb();
    return db.collection<Unit>("units").deleteMany(
      { playerId },
      { session }
    );
  }

  static async getByGameId(gameId: ObjectId) {
    const db = getDb();
    return db.collection<Unit>("units").find({ gameId }).toArray();
  }
}
