import { ClientSession, Types } from "mongoose";
import { Station } from "@solaris-command/core";
import { StationModel } from "../db/schemas/station";

export class StationService {
  static async deleteByPlayerId(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    session?: ClientSession
  ) {
    return StationModel.deleteMany({ gameId, playerId }, { session });
  }

  static async getByGameId(gameId: Types.ObjectId) {
    return StationModel.find({ gameId });
  }

  static async getByPlayerId(gameId: Types.ObjectId, playerId: Types.ObjectId) {
    return StationModel.find({ gameId, playerId });
  }

  static async getStationById(gameId: Types.ObjectId, stationId: Types.ObjectId) {
    return StationModel.findOne({ gameId, _id: stationId });
  }

  static async createStation(
    station: Station,
    session?: ClientSession
  ) {
    const newStation = new StationModel(station);
    await newStation.save({ session });
    return newStation;
  }

  static async deleteStation(gameId: Types.ObjectId, stationId: Types.ObjectId) {
    await StationModel.deleteOne({ gameId, _id: stationId });
  }
}
