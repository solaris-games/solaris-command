import { ClientSession, Types } from "mongoose";
import { Station, UnifiedId } from "@solaris-command/core";
import { StationModel } from "../db/schemas/station";

export class StationService {
  static async deleteByPlayerId(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    return StationModel.deleteMany({ gameId, playerId }, { session });
  }

  static async getByGameId(gameId: UnifiedId) {
    return StationModel.find({ gameId });
  }

  static async getByPlayerId(gameId: UnifiedId, playerId: UnifiedId) {
    return StationModel.find({ gameId, playerId });
  }

  static async getStationById(gameId: UnifiedId, stationId: UnifiedId) {
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

  static async deleteStation(gameId: UnifiedId, stationId: UnifiedId) {
    await StationModel.deleteOne({ gameId, _id: stationId });
  }
}
