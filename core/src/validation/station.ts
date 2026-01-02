import { CONSTANTS } from "../data/constants";
import { ERROR_CODES } from "../data/error-codes";
import { Hex } from "../types/hex";
import { Player } from "../types/player";
import { Station } from "../types/station";
import { HexUtils } from "../utils/hex-utils";

export interface ValidationResult {
  isValid: boolean;
  errorCode?: string;
}

export const StationValidation = {
  validateBuildStation(
    player: Player,
    hex: Hex,
    stations: Station[]
  ): ValidationResult {
    if (String(hex.playerId) !== String(player._id)) {
      return { isValid: false, errorCode: ERROR_CODES.PLAYER_DOES_NOT_OWN_HEX };
    }

    if (hex.planetId != null) {
      return { isValid: false, errorCode: ERROR_CODES.HEX_OCCUPIED_BY_PLANET };
    }

    const hexCoordsId = HexUtils.getCoordsID(hex.location);
    const existingStation = stations.find(
      (s) => HexUtils.getCoordsID(s.location) === hexCoordsId
    );

    if (existingStation) {
      return { isValid: false, errorCode: ERROR_CODES.HEX_OCCUPIED_BY_STATION };
    }

    if (player.prestigePoints < CONSTANTS.STATION_PRESTIGE_COST) {
      return {
        isValid: false,
        errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE,
      };
    }

    return { isValid: true };
  },
};
