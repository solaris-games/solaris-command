import { ClientSession, Types } from "mongoose";
import {
  Hex,
  HexCoords,
  HexUtils,
  TerrainTypes,
  UnifiedId,
  Unit,
  UNIT_CATALOG_ID_MAP,
  UnitManager,
} from "@solaris-command/core";
import { HexModel } from "../db/schemas/hex";

export class HexService {
  static async getByGameId(gameId: UnifiedId) {
    return HexModel.find({ gameId });
  }

  static async getByGameIdAndPlayerId(gameId: UnifiedId, playerId: UnifiedId) {
    return HexModel.find({ gameId, playerId });
  }

  static async getByGameAndId(gameId: UnifiedId, hexId: UnifiedId) {
    return HexModel.findOne({
      gameId,
      _id: hexId,
    });
  }

  static async getByGameAndLocation(gameId: UnifiedId, location: HexCoords) {
    return HexModel.findOne({
      gameId,
      "location.q": location.q,
      "location.r": location.r,
      "location.s": location.s,
    });
  }

  static async getByGameAndIds(gameId: UnifiedId, hexIds: UnifiedId[]) {
    return HexModel.find({
      gameId,
      _id: { $in: hexIds },
    });
  }

  static async insertHexes(hexes: Hex[], session?: ClientSession) {
    await HexModel.insertMany(hexes, { session });
  }

  static async updateHexUnit(
    gameId: UnifiedId,
    hexId: UnifiedId,
    unitId: UnifiedId | null,
    session?: ClientSession
  ) {
    return HexModel.updateOne(
      { gameId, _id: hexId },
      { $set: { unitId } },
      { session }
    );
  }

  static async updateHexStation(
    gameId: UnifiedId,
    hexId: UnifiedId,
    stationId: UnifiedId | null,
    session?: ClientSession
  ) {
    return HexModel.updateOne(
      { gameId, _id: hexId },
      { $set: { stationId } },
      { session }
    );
  }

  static async updateHexOwnership(
    gameId: UnifiedId,
    hexId: UnifiedId,
    playerId: UnifiedId | null,
    session?: ClientSession
  ) {
    return HexModel.updateOne(
      { gameId, _id: hexId },
      { $set: { playerId } },
      { session }
    );
  }

  static async addUnitToAdjacentHexZOC(
    gameId: UnifiedId,
    hex: Hex,
    unit: Unit,
    session?: ClientSession
  ) {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

    // This only applies if the unit has a ZOC.
    if (!unitCtlg.stats.zoc) {
      return;
    }

    // Units with no active steps to not project a ZOC.
    const hasActiveSteps = UnitManager.getActiveSteps(unit).length > 0;

    if (!hasActiveSteps) {
      return;
    }

    // Get all locations that we need to update.
    const coords = HexUtils.neighbors(hex.location).concat([hex.location]);

    // Find and update all hexes
    // Using $or for better performance than multiple round trips
    const hexConditions = coords.map((c) => ({
      "location.q": c.q,
      "location.r": c.r,
      "location.s": c.s,
      terrain: {
        $ne: TerrainTypes.GRAVITY_WELL // Not impassible
      }
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
    gameId: UnifiedId,
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

    const hexConditions = coords.map((c) => ({
      "location.q": c.q,
      "location.r": c.r,
      "location.s": c.s,
    }));

    return HexModel.updateMany(
      {
        gameId,
        $or: hexConditions,
      },
      { $pull: { zoc: { unitId: unit._id } } },
      { session }
    );
  }

  static async removeAllPlayerZOC(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    return HexModel.updateMany(
      { gameId },
      { $pull: { zoc: { playerId: playerId } } },
      { session }
    );
  }

  static async removePlayerOwnership(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    return HexModel.updateMany(
      { gameId, playerId },
      { $set: { playerId: null } },
      { session }
    );
  }

  static async removePlayerUnits(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    return HexModel.updateMany(
      { gameId, playerId },
      { $set: { unitId: null } },
      { session }
    );
  }

  static async removePlayerStations(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    return HexModel.updateMany(
      { gameId, playerId },
      { $set: { stationId: null } },
      { session }
    );
  }
}
