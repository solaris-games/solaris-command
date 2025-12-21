import { ClientSession, Types } from "mongoose";
import {
  Hex,
  HexCoords,
  HexUtils,
  Unit,
  UNIT_CATALOG_ID_MAP,
} from "@solaris-command/core";
import { HexModel } from "../db/schemas/hex";

export class HexService {
  static async removeOwnership(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    session?: ClientSession
  ) {
    return HexModel.updateMany(
      { gameId, playerId },
      { $set: { playerId: null } },
      { session }
    );
  }

  static async getByGameId(gameId: Types.ObjectId) {
    return HexModel.find({ gameId });
  }

  static async getByGameIdAndPlayerId(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId
  ) {
    return HexModel.find({ gameId, playerId });
  }

  static async getByGameAndId(gameId: Types.ObjectId, hexId: Types.ObjectId) {
    return HexModel.findOne({
      gameId,
      _id: hexId,
    });
  }

  static async getByGameAndLocation(
    gameId: Types.ObjectId,
    location: HexCoords
  ) {
    return HexModel.findOne({
      gameId,
      "location.q": location.q,
      "location.r": location.r,
      "location.s": location.s,
    });
  }

  static async getByGameAndIds(gameId: Types.ObjectId, hexIds: Types.ObjectId[]) {
    return HexModel.find({
      gameId,
      _id: { $in: hexIds },
    });
  }

  static async insertHexes(hexes: Hex[], session?: ClientSession) {
    await HexModel.insertMany(hexes, { session });
  }

  static async updateHexUnit(
    gameId: Types.ObjectId,
    hexId: Types.ObjectId,
    unitId: Types.ObjectId | null,
    session?: ClientSession
  ) {
    return HexModel.updateOne(
      { gameId, _id: hexId },
      { $set: { unitId } },
      { session }
    );
  }

  static async updateHexStation(
    gameId: Types.ObjectId,
    hexId: Types.ObjectId,
    stationId: Types.ObjectId | null,
    session?: ClientSession
  ) {
    return HexModel.updateOne(
      { gameId, _id: hexId },
      { $set: { stationId } },
      { session }
    );
  }

  static async updateHexOwnership(
    gameId: Types.ObjectId,
    hexId: Types.ObjectId,
    playerId: Types.ObjectId | null,
    session?: ClientSession
  ) {
    return HexModel.updateOne(
      { gameId, _id: hexId },
      { $set: { playerId } },
      { session }
    );
  }

  static async addUnitToAdjacentHexZOC(
    gameId: Types.ObjectId,
    hex: Hex,
    unit: Unit,
    session?: ClientSession
  ) {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

    // This only applies if the unit has a ZOC.
    if (!unitCtlg.stats.zoc) {
      return;
    }

    // Get all locations that we need to update.
    const coords = HexUtils.neighbors(hex.location).concat([hex.location]);

    // Find and update all hexes
    // Using $or for better performance than multiple round trips
    const hexConditions = coords.map(c => ({
      "location.q": c.q,
      "location.r": c.r,
      "location.s": c.s
    }));

    // We update all hexes matching the coordinates in the game
    return HexModel.updateMany(
      {
        gameId,
        $or: hexConditions,
      },
      // Note: It is ok to push here, we don't need to check for duplicate entries since this is only called on unit spawn
      { $push: { zoc: { playerId: unit.playerId, unitId: unit._id } } },
      { session }
    );
  }

  static async removeUnitFromAdjacentHexZOC(
    gameId: Types.ObjectId,
    hex: Hex,
    unit: Unit,
    session?: ClientSession
  ) {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

    // This only applies if the unit has a ZOC.
    if (!unitCtlg.stats.zoc) {
      return;
    }

    // Get all locations that we need to update.
    const coords = HexUtils.neighbors(hex.location).concat([hex.location]);

    const hexConditions = coords.map(c => ({
      "location.q": c.q,
      "location.r": c.r,
      "location.s": c.s
    }));

    return HexModel.updateMany(
      {
        gameId,
        $or: hexConditions
      },
      { $pull: { zoc: { unitId: unit._id } } },
      { session }
    );
  }

  static async removeAllPlayerZOC(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    session?: ClientSession
  ) {
    return HexModel.updateMany(
      { gameId },
      { $pull: { zoc: { playerId: playerId } } },
      { session }
    );
  }
}
