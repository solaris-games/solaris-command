import { ClientSession, ObjectId } from "mongodb";
import { Unit } from "@solaris-command/core";
import { getDb } from "../db/instance";

export class UnitService {
  static async deleteByPlayerId(playerId: ObjectId, session?: ClientSession) {
    const db = getDb();
    return db.collection<Unit>("units").deleteMany(
      { playerId },
      { session }
    );
  }

  static async getByGameId(gameId: ObjectId) {
    const db = getDb();
    return db.collection<Unit>("units").find({ gameId }).toArray();
  }

  static async getUnitById(unitId: ObjectId) {
      const db = getDb();
      return db.collection<Unit>("units").findOne({ _id: unitId });
  }

  static async createUnit(unit: Unit) {
      const db = getDb();
      const result = await db.collection<Unit>("units").insertOne(unit);
      return { ...unit, _id: result.insertedId };
  }

  static async updateUnit(unitId: ObjectId, update: any) {
      const db = getDb();
      return db.collection<Unit>("units").updateOne(
          { _id: unitId },
          update
      );
  }

  static async updateUnitState(unitId: ObjectId, newState: any, movement?: any, combat?: any) {
      const db = getDb();
      const update: any = {
          $set: {
              "state.status": newState,
          }
      };

      if (movement) {
          if (movement.path) update.$set["movement.path"] = movement.path;
      }

      if (combat) {
          if (combat.hexId !== undefined) update.$set["combat.hexId"] = combat.hexId;
          if (combat.type !== undefined) update.$set["combat.type"] = combat.type;
      }

      return db.collection<Unit>("units").updateOne(
          { _id: unitId },
          update
      );
  }

  static async upgradeUnit(unitId: ObjectId, newSteps: any[], activeSteps: number, suppressedSteps: number, cost: number, playerId: ObjectId) {
       const db = getDb();
       const session = db.client.startSession();

       try {
           session.startTransaction();

           // Update Unit
           await db.collection("units").updateOne(
               { _id: unitId },
               {
                   $set: {
                       steps: newSteps,
                       "state.activeSteps": activeSteps,
                       "state.suppressedSteps": suppressedSteps,
                   }
               },
               { session }
           );

           // Deduct Cost
           await db.collection("players").updateOne(
               { _id: playerId },
               { $inc: { prestigePoints: -cost } },
               { session }
           );

           await session.commitTransaction();
           return true;
       } catch (e) {
           await session.abortTransaction();
           throw e;
       } finally {
           await session.endSession();
       }
  }

  static async scrapUnitStep(unitId: ObjectId, newSteps: any[], activeSteps: number, suppressedSteps: number) {
      const db = getDb();
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

  static async deleteUnit(unitId: ObjectId) {
      const db = getDb();
      return db.collection("units").deleteOne({ _id: unitId });
  }
}
