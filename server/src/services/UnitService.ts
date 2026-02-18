import { ClientSession, Types } from "mongoose";
import {
  UnifiedId,
  Unit,
  UnitCombat,
  UnitMovement,
  UnitStatus,
  UnitStep,
} from "@solaris-command/core";
import { UnitModel } from "../db/schemas/unit";

export class UnitService {
  static async deleteByPlayerId(
    gameId: UnifiedId,
    playerId: UnifiedId,
    session?: ClientSession
  ) {
    return UnitModel.deleteMany({ gameId, playerId }, { session });
  }

  static async getByGameId(gameId: UnifiedId) {
    return UnitModel.find({ gameId });
  }

  static async getByGameIdLean(gameId: UnifiedId) {
    return UnitModel.find({ gameId }).lean();
  }

  static async getUnitById(gameId: UnifiedId, unitId: UnifiedId) {
    return UnitModel.findOne({ gameId, _id: unitId });
  }

  static async createUnit(unit: Unit, session?: ClientSession) {
    // Insert unit with session for transaction support
    const newUnit = new UnitModel(unit);
    await newUnit.save({ session });
    return newUnit;
  }

  static async updateUnit(
    gameId: UnifiedId,
    unitId: UnifiedId,
    update: any
  ) {
    return UnitModel.updateOne({ gameId, _id: unitId }, update);
  }

  static async declareUnitMovement(
    gameId: UnifiedId,
    unitId: UnifiedId,
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

  static async cancelUnitMovement(gameId: UnifiedId, unitId: UnifiedId) {
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
    gameId: UnifiedId,
    unitId: UnifiedId,
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

  static async cancelUnitAttack(gameId: UnifiedId, unitId: UnifiedId) {
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

  static async cancelUnitAttackByHex(gameId: UnifiedId, hexId: UnifiedId) {
    return UnitModel.updateOne(
      { gameId, 'combat.hexId': hexId },
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
    gameId: UnifiedId,
    unitId: UnifiedId,
    newSteps: UnitStep[],
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
    gameId: UnifiedId,
    unitId: UnifiedId,
    newSteps: UnitStep[],
    session?: ClientSession
  ) {
    return UnitModel.updateOne(
      { gameId, _id: unitId },
      {
        $set: {
          steps: newSteps,
        },
      },
      { session }
    );
  }

  static async deleteUnit(
    gameId: UnifiedId,
    unitId: UnifiedId,
    session?: ClientSession
  ) {
    return UnitModel.deleteOne({ gameId, _id: unitId }, { session });
  }
}
