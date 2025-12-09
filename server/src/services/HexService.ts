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

  static async insertHexes(db: Db, hexes: Hex[]) {
    await db.collection("hexes").insertMany(hexes);
  }

  static async updateHexUnit(
    db: Db,
    hexId: ObjectId,
    unitId: ObjectId | null,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateOne({ _id: hexId }, { $set: { unitId } }, { session });
  }

  static async updateHexOwnership(
    db: Db,
    hexId: ObjectId,
    playerId: ObjectId | null,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateOne({ _id: hexId }, { $set: { playerId } }, { session });
  }
}
