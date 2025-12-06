import { ClientSession, ObjectId } from "mongodb";
import { Hex } from "@solaris-command/core";
import { getDb } from "../db/instance";

export class HexService {
  static async removeOwnership(playerId: ObjectId, session?: ClientSession) {
    const db = getDb();
    return db.collection<Hex>("hexes").updateMany(
      { playerId },
      { $set: { playerId: null } },
      { session }
    );
  }

  static async getByGameId(gameId: ObjectId) {
    const db = getDb();
    return db.collection<Hex>("hexes").find({ gameId }).toArray();
  }
}
