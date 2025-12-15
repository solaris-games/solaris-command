import { ClientSession, Db, ObjectId } from "mongodb";
import {
  Unit,
  UnitCombat,
  UnitMovement,
  UnitStatus,
} from "@solaris-command/core";
import { executeInTransaction, getDb } from "../db/instance";
import { PlayerService } from "./PlayerService";

export class UnitService {
  static async deleteByPlayerId(
    db: Db,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db.collection<Unit>("units").deleteMany({ playerId }, { session });
  }

  static async getByGameId(db: Db, gameId: ObjectId) {
    return db.collection<Unit>("units").find({ gameId }).toArray();
  }

  static async getUnitById(db: Db, unitId: ObjectId) {
    return db.collection<Unit>("units").findOne({ _id: unitId });
  }

  static async createUnit(db: Db, unit: Unit, session?: ClientSession) {
    // Insert unit with session for transaction support
    const result = await db
      .collection<Unit>("units")
      .insertOne(unit, { session });
    return { ...unit, _id: result.insertedId };
  }

  static async updateUnit(db: Db, unitId: ObjectId, update: any) {
    return db.collection<Unit>("units").updateOne({ _id: unitId }, update);
  }

  static async declareUnitMovement(
    db: Db,
    unitId: ObjectId,
    movement: UnitMovement
  ) {
    const update: any = {
      $set: {
        "state.status": UnitStatus.MOVING,
        movement: {
          path: movement.path,
        },
      },
    };

    return db.collection<Unit>("units").updateOne({ _id: unitId }, update);
  }

  static async cancelUnitMovement(db: Db, unitId: ObjectId) {
    return db.collection<Unit>("units").updateOne({ _id: unitId }, {
      $set: {
        "state.status": UnitStatus.IDLE,
        movement: {
          path: [],
        },
      },
    });
  }

  static async declareUnitAttack(db: Db, unitId: ObjectId, combat: UnitCombat) {
    return db.collection<Unit>("units").updateOne({ _id: unitId }, {
      $set: {
        "state.status": UnitStatus.PREPARING,
        combat: {
          location: combat.location,
          operation: combat.operation,
          advanceOnVictory: combat.advanceOnVictory,
        },
      },
    });
  }

  static async cancelUnitAttack(db: Db, unitId: ObjectId) {
    return db.collection<Unit>("units").updateOne({ _id: unitId }, {
      $set: {
        "state.status": UnitStatus.IDLE,
        combat: {
          location: null,
          operation: null,
          advanceOnVictory: null,
        },
      },
    });
  }

  static async upgradeUnit(
    db: Db,
    unitId: ObjectId,
    newSteps: any[],
    session?: ClientSession
  ) {
    // Update Unit
    await db.collection<Unit>("units").updateOne(
      { _id: unitId },
      {
        $set: {
          steps: newSteps,
        },
      },
      { session }
    );
  }

  static async scrapUnitStep(
    db: Db,
    unitId: ObjectId,
    newSteps: any[],
  ) {
    return db.collection<Unit>("units").updateOne(
      { _id: unitId },
      {
        $set: {
          steps: newSteps
        },
      }
    );
  }

  static async deleteUnit(db: Db, unitId: ObjectId) {
    return db.collection<Unit>("units").deleteOne({ _id: unitId });
  }
}
