import { HexUtils } from "./hex-utils";
import {
  CONSTANTS,
  ERROR_CODES,
  TERRAIN_MP_COSTS,
  UNIT_CATALOG_ID_MAP,
} from "../data";
import { HexCoords, HexCoordsId } from "../types/geometry";
import { UnifiedId, Unit, Hex, Planet, TerrainTypes } from "../types";

export const MapUtils = {
  /**
   * Calculates the MP cost for the player to move a unit into a hex. Accounts for ZOC influence.
   */
  getHexMPCost(hex: Hex, playerId: UnifiedId | null) {
    let mpCost = TERRAIN_MP_COSTS[hex.terrain];

    if (mpCost == null) {
      throw new Error(ERROR_CODES.HEX_TERRAIN_UNKNOWN);
    }

    if (playerId && MapUtils.isHexInEnemyZOC(hex, playerId)) {
      mpCost *= CONSTANTS.TERRAIN_MP_COST_ZOC_MULTIPLIER;
    }

    return mpCost;
  },

  /**
   * Check if a specific player is affected by ZOC in a target hex
   */
  isHexInEnemyZOC(hex: Hex, playerId: UnifiedId) {
    return hex.zoc.some((z) => String(z.playerId) !== String(playerId));
  },

  removeUnitHexZOC(unit: Unit, hexLookup: Map<HexCoordsId, Hex>) {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

    // Do not need to do this if unit doesn't project a ZOC.
    if (!unitCtlg.stats.zoc) {
      return;
    }

    // Get all of the neighbors (plus the current hex) and remove ZOC influence
    const ZOCCoords = HexUtils.neighbors(unit.location).concat([unit.location]);

    ZOCCoords.forEach((coords) => {
      const hex = hexLookup.get(HexUtils.getCoordsID(coords))!;

      // No need to store ZOC on impassible hexes.
      if (hex && !MapUtils.isHexImpassable(hex)) {
        const existing = hex.zoc.findIndex(
          (z) => String(z.unitId) === String(unit._id)
        );

        if (existing > -1) {
          hex.zoc.splice(existing, 1);
        }
      }
    });
  },

  isHexImpassable(hex: Hex): boolean {
    return hex.terrain === TerrainTypes.GRAVITY_WELL;
  },

  findPlayerPlanets(planets: Planet[], playerId: UnifiedId): Planet[] {
    return planets.filter((p) => String(p.playerId) === String(playerId));
  },

  findPlayerCapital(planets: Planet[], playerId: UnifiedId): Planet | null {
    return (
      MapUtils.findPlayerPlanets(planets, playerId).find((p) => p.isCapital) ||
      null
    );
  },

  findUnownedCapital(planets: Planet[]): Planet | null {
    return planets.find((p) => p.isCapital && p.playerId === null) || null;
  },

  findNearestFreeHexes(hexes: Hex[], center: HexCoords, count: number): Hex[] {
    const results: Hex[] = [];
    const hexMap = new Map<HexCoordsId, Hex>();
    hexes.forEach((h) => hexMap.set(HexUtils.getCoordsID(h.location), h));

    let radius = 1;
    // Safety break to prevent infinite loops if map is totally full
    const MAX_RADIUS = 10;

    while (results.length < count && radius <= MAX_RADIUS) {
      const candidates = HexUtils.getHexCoordsInRing(center, radius);

      // Randomize candidates to prevent directional bias
      // Fisher-Yates shuffle
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
      }

      for (const coord of candidates) {
        if (results.length >= count) break;

        const hexId = HexUtils.getCoordsID(coord);
        const hex = hexMap.get(hexId);

        if (hex && !hex.unitId && !MapUtils.isHexImpassable(hex)) {
          results.push(hex);
        }
      }

      radius++;
    }

    return results;
  },
};
