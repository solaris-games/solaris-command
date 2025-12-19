import { ClientSession, Db, ObjectId } from "mongodb";
import { Hex, HexCoords } from "@solaris-command/core";

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

  static async getByGameIdAndPlayerId(
    db: Db,
    gameId: ObjectId,
    playerId: ObjectId
  ) {
    return db.collection<Hex>("hexes").find({ gameId, playerId }).toArray();
  }

  static async getByGameAndId(db: Db, gameId: ObjectId, hexId: ObjectId) {
    return db.collection<Hex>("hexes").findOne({
      gameId,
      _id: hexId,
    });
  }

  static async getByGameAndLocation(
    db: Db,
    gameId: ObjectId,
    location: HexCoords
  ) {
    return db.collection<Hex>("hexes").findOne({
      gameId,
      "coord.q": location.q,
      "coord.r": location.r,
      "coord.s": location.s,
    });
  }

  static async getByGameAndIds(db: Db, gameId: ObjectId, hexIds: ObjectId[]) {
    return db
      .collection<Hex>("hexes")
      .find({
        gameId,
        _id: { $in: hexIds },
      })
      .toArray();
  }

  static async insertHexes(db: Db, hexes: Hex[]) {
    await db.collection<Hex>("hexes").insertMany(hexes);
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

  static async updateHexStation(
    db: Db,
    hexId: ObjectId,
    stationId: ObjectId | null,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateOne({ _id: hexId }, { $set: { stationId } }, { session });
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
