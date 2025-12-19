import { ObjectId } from "mongodb";
import { Unit, UnitStatus, UnitStep } from "../models/unit";
import { HexCoords } from "../types/geometry";
import { UNIT_CATALOG_ID_MAP } from "../data/units";

export class UnitFactory {
  static createUnit(
    catalogId: string,
    playerId: ObjectId,
    gameId: ObjectId,
    hexId: ObjectId,
    location: HexCoords
  ): Unit {
    const catalogItem = UNIT_CATALOG_ID_MAP.get(catalogId);

    if (!catalogItem) {
      throw new Error(`Unit catalog ID not found: ${catalogId}`);
    }

    // Create steps array based on default steps
    const steps: UnitStep[] = [];
    for (let i = 0; i < catalogItem.stats.defaultSteps; i++) {
      steps.push({
        isSuppressed: false,
        specialistId: null,
      });
    }

    const unit: Unit = {
      _id: new ObjectId(),
      gameId: gameId,
      playerId: playerId,
      catalogId: catalogId,
      hexId: hexId,
      location: location,
      steps: steps,

      state: {
        status: UnitStatus.IDLE,
        ap: catalogItem.stats.maxAP,
        mp: catalogItem.stats.maxMP,
      },

      movement: {
        path: [],
      },

      combat: {
        hexId: null,
        location: null,
        operation: null,
        advanceOnVictory: null,
      },

      supply: {
        isInSupply: true,
        ticksLastSupply: 0,
        ticksOutOfSupply: 0,
      },
    };

    return unit;
  }
}
