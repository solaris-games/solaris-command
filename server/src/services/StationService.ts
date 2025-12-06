import { ClientSession, ObjectId } from "mongodb";
import { Station, StationStatus } from "@solaris-command/core";
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

  static async getStationById(stationId: ObjectId) {
      const db = getDb();
      return db.collection<Station>("stations").findOne({ _id: stationId });
  }

  static async createStation(station: Station) {
      const db = getDb();
      const result = await db.collection<Station>("stations").insertOne(station);
      return { ...station, _id: result.insertedId };
  }

  static async decommissionStation(stationId: ObjectId) {
      const db = getDb();
      // Correct field is 'status' not 'state' based on Station interface.
      // The original route had a bug using 'state'. I will fix it here to 'status'.
      return db.collection<Station>("stations").updateOne(
          { _id: stationId },
          {
              $set: { status: StationStatus.DECOMMISSIONING },
          }
      );
  }
}
