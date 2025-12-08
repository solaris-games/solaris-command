import { ClientSession, Db, ObjectId } from "mongodb";
import { Hex } from "@solaris-command/core";

export class HexService {
  static async removeOwnership(
    db: Db,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateMany({ playerId }, { $set: { playerId: null } }, { session });
  }

  static async getByGameId(db: Db, gameId: ObjectId) {
    return db.collection<Hex>("hexes").find({ gameId }).toArray();
  }
}
