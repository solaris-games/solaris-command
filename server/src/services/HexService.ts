import { ClientSession, Db, ObjectId, WithId } from "mongodb";
import {
  Hex,
  HexCoords,
  HexUtils,
  Unit,
  UNIT_CATALOG_ID_MAP,
} from "@solaris-command/core";

export class HexService {
  static async removeOwnership(
    db: Db,
    gameId: ObjectId,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateMany(
        { gameId, playerId },
        { $set: { playerId: null } },
        { session }
      );
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
    gameId: ObjectId,
    hexId: ObjectId,
    unitId: ObjectId | null,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateOne({ gameId, _id: hexId }, { $set: { unitId } }, { session });
  }

  static async updateHexStation(
    db: Db,
    gameId: ObjectId,
    hexId: ObjectId,
    stationId: ObjectId | null,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateOne({ gameId, _id: hexId }, { $set: { stationId } }, { session });
  }

  static async updateHexOwnership(
    db: Db,
    gameId: ObjectId,
    hexId: ObjectId,
    playerId: ObjectId | null,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateOne({ gameId, _id: hexId }, { $set: { playerId } }, { session });
  }

  static async addUnitToAdjacentHexZOC(
    db: Db,
    gameId: ObjectId,
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
    const hexes = await Promise.all(
      coords.map((c) => HexService.getByGameAndLocation(db, gameId, c))
    );

    const hexIds = hexes.map((h) => h!._id);

    return db.collection<Hex>("hexes").updateMany(
      {
        _id: {
          $in: hexIds,
        },
      },
      // Note: It is ok to push here, we don't need to check for duplicate entries since this is only called on unit spawn
      { $push: { zoc: { playerId: unit.playerId, unitId: unit._id } } },
      { session }
    );
  }

  static async removeUnitFromAdjacentHexZOC(
    db: Db,
    gameId: ObjectId,
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
    const hexes = await Promise.all(
      coords.map((c) => HexService.getByGameAndLocation(db, gameId, c))
    );

    const hexIds = hexes.map((h) => h!._id);

    return db.collection<Hex>("hexes").updateMany(
      {
        _id: {
          $in: hexIds,
        },
      },
      { $pull: { zoc: { unitId: unit._id } } },
      { session }
    );
  }

  static async removeAllPlayerZOC(
    db: Db,
    gameId: ObjectId,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Hex>("hexes")
      .updateMany(
        { gameId },
        { $pull: { zoc: { playerId: playerId } } },
        { session }
      );
  }
}
