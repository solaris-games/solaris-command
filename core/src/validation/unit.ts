import {
  CONSTANTS,
  ERROR_CODES,
  UNIT_CATALOG_ID_MAP,
  SPECIALIST_STEP_ID_MAP,
} from "../data";
import { Planet } from "../types/planet";
import { Player } from "../types/player";
import { Unit, UnitStatus, SpecialistStepTypes } from "../types/unit";
import { UnifiedId } from "../types/unified-id";
import { CombatOperation } from "../types/combat";
import { UnitManager } from "../utils/unit-manager";
import { Pathfinding } from "../utils/pathfinding";
import { HexUtils } from "../utils/hex-utils";
import { HexCoords, HexCoordsId } from "../types/geometry";
import { Hex } from "../types/hex";

export interface ValidationResult {
  isValid: boolean;
  errorCode?: string;
}

export const UnitValidation = {
  validateDeployUnit(
    player: Player,
    hex: Hex,
    hexes: Hex[],
    planets: Planet[],
    units: Unit[],
    catalogId: string
  ): ValidationResult {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(catalogId);
    if (!unitCtlg) {
      return { isValid: false, errorCode: ERROR_CODES.UNIT_ID_INVALID };
    }

    if (hex.unitId) {
      return { isValid: false, errorCode: ERROR_CODES.HEX_OCCUPIED_BY_UNIT };
    }

    if (String(hex.playerId) !== String(player._id)) {
      return { isValid: false, errorCode: ERROR_CODES.PLAYER_DOES_NOT_OWN_HEX };
    }

    const validSpawnLocations = UnitManager.getValidSpawnLocations(
      player._id,
      planets,
      hexes,
      units
    );

    if (
      validSpawnLocations.find((h) => String(h._id) === String(hex._id)) == null
    ) {
      return {
        isValid: false,
        errorCode: ERROR_CODES.HEX_INVALID_SPAWN_LOCATION,
      };
    }

    if (player.prestigePoints < unitCtlg.cost) {
      return {
        isValid: false,
        errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE,
      };
    }

    return { isValid: true };
  },

  validateUnitMove(
    unit: Unit,
    hexPath: HexCoords[],
    hexMap: Map<HexCoordsId, Hex>,
    playerId: UnifiedId
  ): ValidationResult {
    if (hexPath.length > CONSTANTS.GAME_DEFAULT_TICKS_PER_CYCLE) {
      return {
        isValid: false,
        errorCode: ERROR_CODES.UNIT_MOVEMENT_PATH_TOO_LONG,
      };
    }

    if (unit.state.status !== UnitStatus.IDLE) {
      return { isValid: false, errorCode: ERROR_CODES.UNIT_IS_NOT_IDLE };
    }

    const validationResult = Pathfinding.validatePath(
      unit.location,
      hexPath,
      unit.state.mp,
      hexMap,
      playerId
    );

    if (!validationResult.valid) {
      return {
        isValid: false,
        errorCode:
          validationResult.error || ERROR_CODES.REQUEST_VALIDATION_FAILED,
      };
    }

    return { isValid: true };
  },

  validateUnitAttack(
    unit: Unit,
    targetHex: Hex,
    targetUnit: Unit,
    operation: CombatOperation
  ): ValidationResult {
    if (unit.state.status !== UnitStatus.IDLE) {
      return { isValid: false, errorCode: ERROR_CODES.UNIT_IS_NOT_IDLE };
    }

    if (unit.state.ap === 0) {
      return { isValid: false, errorCode: ERROR_CODES.UNIT_INSUFFICIENT_AP };
    }

    if (!HexUtils.isNeighbor(unit.location, targetHex.location)) {
      return { isValid: false, errorCode: ERROR_CODES.HEX_IS_NOT_ADJACENT };
    }

    if (!targetHex.unitId) {
      return {
        isValid: false,
        errorCode: ERROR_CODES.HEX_IS_NOT_OCCUPIED_BY_UNIT,
      };
    }

    if (String(targetUnit.playerId) === String(unit.playerId)) {
      return {
        isValid: false,
        errorCode: ERROR_CODES.UNIT_CANNOT_ATTACK_OWN_UNIT,
      };
    }

    if (operation === CombatOperation.SUPPRESSIVE_FIRE) {
      const hasArtillery = UnitManager.unitHasActiveSpecialistStep(unit);
      if (!hasArtillery) {
        return {
          isValid: false,
          errorCode: ERROR_CODES.UNIT_MUST_HAVE_ACTIVE_ARTILLERY_SPECIALIST,
        };
      }
    }

    if (
      targetUnit.state.status === UnitStatus.PREPARING &&
      String(targetUnit.combat.hexId) === String(unit.hexId)
    ) {
      return {
        isValid: false,
        errorCode: ERROR_CODES.UNIT_CANNOT_COUNTER_ATTACK,
      };
    }

    return { isValid: true };
  },

  validateUnitUpgrade(
    unit: Unit,
    player: Player,
    type: "STEP" | "SPECIALIST",
    specialistId?: string
  ): ValidationResult {
    const unitTemplate = UNIT_CATALOG_ID_MAP.get(unit.catalogId);
    if (!unitTemplate) {
      return { isValid: false, errorCode: ERROR_CODES.UNIT_TEMPLATE_NOT_FOUND };
    }

    if (!unit.supply.isInSupply) {
      return { isValid: false, errorCode: ERROR_CODES.UNIT_IS_NOT_IN_SUPPLY };
    }

    let cost = 0;

    if (type === "STEP") {
      if (unit.steps.length >= unitTemplate.stats.maxSteps) {
        return { isValid: false, errorCode: ERROR_CODES.UNIT_IS_AT_MAX_STEPS };
      }
      cost = CONSTANTS.UNIT_STEP_BASE_COST;
      if (player.prestigePoints < cost) {
        return {
          isValid: false,
          errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE,
        };
      }
    } else if (type === "SPECIALIST") {
      if (!specialistId) {
        return {
          isValid: false,
          errorCode: ERROR_CODES.UNIT_SPECIALIST_ID_REQUIRED,
        };
      }
      const spec = SPECIALIST_STEP_ID_MAP.get(specialistId);
      if (!spec) {
        return {
          isValid: false,
          errorCode: ERROR_CODES.UNIT_SPECIALIST_ID_INVALID,
        };
      }

      if (unit.steps.length >= unitTemplate.stats.maxSteps) {
        return { isValid: false, errorCode: ERROR_CODES.UNIT_IS_AT_MAX_STEPS };
      }

      if (spec.type === SpecialistStepTypes.SCOUTS && !unitTemplate.stats.zoc) {
        return {
          isValid: false,
          errorCode: ERROR_CODES.UNIT_DOES_NOT_PROJECT_ZOC,
        };
      }

      cost = spec.cost;
      if (player.prestigePoints < cost) {
        return {
          isValid: false,
          errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE,
        };
      }
    } else {
      return {
        isValid: false,
        errorCode: ERROR_CODES.UNIT_INVALID_UPGRADE_TYPE,
      };
    }

    return { isValid: true };
  },
};
