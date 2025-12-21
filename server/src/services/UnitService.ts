import { ClientSession, Types } from "mongoose";
import {
  Unit,
  UnitCombat,
  UnitMovement,
  UnitStatus,
} from "@solaris-command/core";
import { UnitModel } from "../db/schemas/unit";

export class UnitService {
  static async deleteByPlayerId(
    gameId: Types.ObjectId,
    playerId: Types.ObjectId,
    session?: ClientSession
  ) {
    return UnitModel.deleteMany({ gameId, playerId }, { session });
  }

  static async getByGameId(gameId: Types.ObjectId) {
    return UnitModel.find({ gameId });
  }

  static async getUnitById(gameId: Types.ObjectId, unitId: Types.ObjectId) {
    return UnitModel.findOne({ gameId, _id: unitId });
  }

  static async createUnit(unit: Unit, session?: ClientSession) {
    // Insert unit with session for transaction support
    const newUnit = new UnitModel(unit);
    await newUnit.save({ session });
    return newUnit;
  }

  static async updateUnit(
    gameId: Types.ObjectId,
    unitId: Types.ObjectId,
    update: any
  ) {
    return UnitModel.updateOne({ gameId, _id: unitId }, update);
  }

  static async declareUnitMovement(
    gameId: Types.ObjectId,
    unitId: Types.ObjectId,
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

    return UnitModel.updateOne({ gameId, _id: unitId }, update);
  }

  static async cancelUnitMovement(gameId: Types.ObjectId, unitId: Types.ObjectId) {
    return UnitModel.updateOne(
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
    gameId: Types.ObjectId,
    unitId: Types.ObjectId,
    combat: UnitCombat
  ) {
    return UnitModel.updateOne(
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

  static async cancelUnitAttack(gameId: Types.ObjectId, unitId: Types.ObjectId) {
    return UnitModel.updateOne(
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
    gameId: Types.ObjectId,
    unitId: Types.ObjectId,
    newSteps: any[],
    session?: ClientSession
  ) {
    // Update Unit
    await UnitModel.updateOne(
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
    gameId: Types.ObjectId,
    unitId: Types.ObjectId,
    newSteps: any[]
  ) {
    return UnitModel.updateOne(
      { gameId, _id: unitId },
      {
        $set: {
          steps: newSteps,
        },
      }
    );
  }

  static async deleteUnit(gameId: Types.ObjectId, unitId: Types.ObjectId) {
    return UnitModel.deleteOne({ gameId, _id: unitId });
  }
}
