import { ClientSession, Db, ObjectId } from "mongodb";
import {
  Unit,
  UnitCombat,
  UnitMovement,
  UnitStatus,
} from "@solaris-command/core";

export class UnitService {
  static async deleteByPlayerId(
    db: Db,
    gameId: ObjectId,
    playerId: ObjectId,
    session?: ClientSession
  ) {
    return db
      .collection<Unit>("units")
      .deleteMany({ gameId, playerId }, { session });
  }

  static async getByGameId(db: Db, gameId: ObjectId) {
    return db.collection<Unit>("units").find({ gameId }).toArray();
  }

  static async getUnitById(db: Db, gameId: ObjectId, unitId: ObjectId) {
    return db.collection<Unit>("units").findOne({ gameId, _id: unitId });
  }

  static async createUnit(db: Db, unit: Unit, session?: ClientSession) {
    // Insert unit with session for transaction support
    const result = await db
      .collection<Unit>("units")
      .insertOne(unit, { session });
    return { ...unit, _id: result.insertedId };
  }

  static async updateUnit(
    db: Db,
    gameId: ObjectId,
    unitId: ObjectId,
    update: any
  ) {
    return db
      .collection<Unit>("units")
      .updateOne({ gameId, _id: unitId }, update);
  }

  static async declareUnitMovement(
    db: Db,
    gameId: ObjectId,
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

    return db
      .collection<Unit>("units")
      .updateOne({ gameId, _id: unitId }, update);
  }

  static async cancelUnitMovement(db: Db, gameId: ObjectId, unitId: ObjectId) {
    return db.collection<Unit>("units").updateOne(
      { gameId, _id: unitId },
      {
        $set: {
          "state.status": UnitStatus.IDLE,
          movement: {
            path: [],
          },
        },
      }
    );
  }

  static async declareUnitAttack(
    db: Db,
    gameId: ObjectId,
    unitId: ObjectId,
    combat: UnitCombat
  ) {
    return db.collection<Unit>("units").updateOne(
      { gameId, _id: unitId },
      {
        $set: {
          "state.status": UnitStatus.PREPARING,
          combat: {
            hexId: combat.hexId,
            location: combat.location,
            operation: combat.operation,
            advanceOnVictory: combat.advanceOnVictory,
          },
        },
      }
    );
  }

  static async cancelUnitAttack(db: Db, gameId: ObjectId, unitId: ObjectId) {
    return db.collection<Unit>("units").updateOne(
      { gameId, _id: unitId },
      {
        $set: {
          "state.status": UnitStatus.IDLE,
          combat: {
            hexId: null,
            location: null,
            operation: null,
            advanceOnVictory: null,
          },
        },
      }
    );
  }

  static async upgradeUnit(
    db: Db,
    gameId: ObjectId,
    unitId: ObjectId,
    newSteps: any[],
    session?: ClientSession
  ) {
    // Update Unit
    await db.collection<Unit>("units").updateOne(
      { gameId, _id: unitId },
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
    gameId: ObjectId,
    unitId: ObjectId,
    newSteps: any[]
  ) {
    return db.collection<Unit>("units").updateOne(
      { gameId, _id: unitId },
      {
        $set: {
          steps: newSteps,
        },
      }
    );
  }

  static async deleteUnit(db: Db, gameId: ObjectId, unitId: ObjectId) {
    return db.collection<Unit>("units").deleteOne({ gameId, _id: unitId });
  }
}
