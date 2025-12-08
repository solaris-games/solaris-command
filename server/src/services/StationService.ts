import { ClientSession, Db, ObjectId } from "mongodb";
import { Station } from "@solaris-command/core";

export class StationService {
  static async deleteByPlayerId(
    db: Db,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Station>("stations")
      .deleteMany({ playerId }, { session });
  }

  static async getByGameId(db: Db, gameId: ObjectId) {
    return db.collection<Station>("stations").find({ gameId }).toArray();
  }

  static async getStationById(db: Db, stationId: ObjectId) {
    return db.collection<Station>("stations").findOne({ _id: stationId });
  }

  static async createStation(db: Db, station: Station) {
    const result = await db.collection<Station>("stations").insertOne(station);
    return { ...station, _id: result.insertedId };
  }

  static async deleteStation(db: Db, stationId: ObjectId) {
    await db.collection<Station>("stations").deleteOne({ _id: stationId });
  }
}
