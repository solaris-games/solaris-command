import { ClientSession, ObjectId } from "mongodb";
import { Station } from "@solaris-command/core";
import { getDb } from "../db/instance";

export class StationService {
  static async deleteByPlayerId(playerId: ObjectId, session?: ClientSession) {
    const db = getDb();
    return db.collection<Station>("stations").deleteMany(
      { playerId },
      { session }
    );
  }

  static async getByGameId(gameId: ObjectId) {
    const db = getDb();
    return db.collection<Station>("stations").find({ gameId }).toArray();
  }
}
