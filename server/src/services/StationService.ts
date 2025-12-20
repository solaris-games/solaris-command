import { ClientSession, Db, ObjectId } from "mongodb";
import { Station } from "@solaris-command/core";

export class StationService {
  static async deleteByPlayerId(
    db: Db,
    gameId: ObjectId,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Station>("stations")
      .deleteMany({ gameId, playerId }, { session });
  }

  static async getByGameId(db: Db, gameId: ObjectId) {
    return db.collection<Station>("stations").find({ gameId }).toArray();
  }

  static async getByPlayerId(db: Db, gameId: ObjectId, playerId: ObjectId) {
    return db
      .collection<Station>("stations")
      .find({ gameId, playerId })
      .toArray();
  }

  static async getStationById(db: Db, gameId: ObjectId, stationId: ObjectId) {
    return db
      .collection<Station>("stations")
      .findOne({ gameId, _id: stationId });
  }

  static async createStation(
    db: Db,
    station: Station,
    session?: ClientSession
  ) {
    const result = await db
      .collection<Station>("stations")
      .insertOne(station, { session });
    return { ...station, _id: result.insertedId };
  }

  static async deleteStation(db: Db, gameId: ObjectId, stationId: ObjectId) {
    await db
      .collection<Station>("stations")
      .deleteOne({ gameId, _id: stationId });
  }
}
