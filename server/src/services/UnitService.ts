import { ClientSession, Db, ObjectId } from "mongodb";
import { Unit } from "@solaris-command/core";
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
    const result = await db
      .collection<Unit>("units")
      .insertOne(unit, { session });
    return { ...unit, _id: result.insertedId };
  }

  static async updateUnit(db: Db, unitId: ObjectId, update: any) {
    return db.collection<Unit>("units").updateOne({ _id: unitId }, update);
  }

  static async updateUnitState(
    db: Db,
    unitId: ObjectId,
    newState: any,
    movement?: any,
    combat?: any
  ) {
    const update: any = {
      $set: {
        "state.status": newState,
      },
    };

    if (movement) {
      if (movement.path) update.$set["movement.path"] = movement.path;
    }

    if (combat) {
      if (combat.hexId !== undefined)
        update.$set["combat.hexId"] = combat.hexId;
      if (combat.type !== undefined) update.$set["combat.type"] = combat.type;
    }

    return db.collection<Unit>("units").updateOne({ _id: unitId }, update);
  }

  static async upgradeUnit(
    db: Db,
    unitId: ObjectId,
    newSteps: any[],
    activeSteps: number,
    suppressedSteps: number,
    session?: ClientSession
  ) {
    // Update Unit
    await db.collection("units").updateOne(
      { _id: unitId },
      {
        $set: {
          steps: newSteps,
          "state.activeSteps": activeSteps,
          "state.suppressedSteps": suppressedSteps,
        },
      },
      { session }
    );
  }

  static async scrapUnitStep(
    db: Db,
    unitId: ObjectId,
    newSteps: any[],
    activeSteps: number,
    suppressedSteps: number
  ) {
    return db.collection("units").updateOne(
      { _id: unitId },
      {
        $set: {
          steps: newSteps,
          "state.activeSteps": activeSteps,
          "state.suppressedSteps": suppressedSteps,
        },
      }
    );
  }

  static async deleteUnit(db: Db, unitId: ObjectId) {
    return db.collection("units").deleteOne({ _id: unitId });
  }
}
