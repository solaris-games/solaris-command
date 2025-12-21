import { HexCoordsId, UnifiedId } from "../types";
import { HexUtils } from "./hex-utils";
import { Unit } from "../models/unit";
import { Planet } from "../models/planet";
import { Station } from "../models/station";
import {
  CONSTANTS,
  SPECIALIST_STEP_ID_MAP,
  UNIT_CATALOG_ID_MAP,
} from "../data";
import { Hex } from "../models";

export const FogOfWar = {
  /**
   * Calculates the set of visible hex IDs for a given player.
   * Based on the location of their Units, Planets, and Stations.
   */
  getVisibleHexes(
    playerId: UnifiedId,
    units: Unit[],
    planets: Planet[],
    stations: Station[]
  ): Set<HexCoordsId> {
    const visibleHexes = new Set<HexCoordsId>();
    const pidStr = String(playerId);

    // 1. Units
    units.forEach((u) => {
      if (String(u.playerId) === pidStr) {
        const unitCtlg = UNIT_CATALOG_ID_MAP.get(u.catalogId)!;

        // Calculate Vision Bonus from Specialists
        let visionAdd = 0;
        u.steps.forEach((step) => {
          if (!step.isSuppressed && step.specialistId) {
            const spec = SPECIALIST_STEP_ID_MAP.get(step.specialistId);
            if (spec && spec.bonuses && spec.bonuses.visionAdd) {
              visionAdd += spec.bonuses.visionAdd;
            }
          }
        });

        const hexes = HexUtils.getHexCoordsInRange(
          u.location,
          unitCtlg.stats.los + visionAdd
        );
        hexes.forEach((h) => visibleHexes.add(HexUtils.getCoordsID(h)));
      }
    });

    // 2. Planets
    planets.forEach((p) => {
      if (p.playerId && String(p.playerId) === pidStr) {
        const hexes = HexUtils.getHexCoordsInRange(p.location, CONSTANTS.PLANET_VISION_RANGE);
        hexes.forEach((h) => visibleHexes.add(HexUtils.getCoordsID(h)));
      }
    });

    // 3. Stations
    stations.forEach((s) => {
      if (s.playerId && String(s.playerId) === pidStr) {
        const hexes = HexUtils.getHexCoordsInRange(s.location, CONSTANTS.STATION_VISION_RANGE);
        hexes.forEach((h) => visibleHexes.add(HexUtils.getCoordsID(h)));
      }
    });

    return visibleHexes;
  },

  /**
   * Masks hexes based on visibility.
   */
  maskHexes(
    playerId: UnifiedId,
    allHexes: Hex[],
    visibleHexes: Set<HexCoordsId>
  ): Hex[] {
    const pidStr = String(playerId);

    return allHexes.map(hex => {
      // If the user owns the hex then do not mask
      if (hex.playerId && String(hex.playerId) === pidStr) return hex

      // If the hex is visible then do not mask
      if (visibleHexes.has(HexUtils.getCoordsID(hex.location))) return hex

      // Otherwise, the hex is out of visible range and we should mask it.
      // Note: We only need to mask the unit on the hex (if there is one) and the hexes ZOC.
      return {
        ...hex,
        unitId: null,
        zoc: []
      }
    })
  },

  /**
   * Filters units based on visibility.
   * Returns:
   *  - All units owned by the player
   *  - Enemy units that are on visible hexes
   */
  filterVisibleUnits(
    playerId: UnifiedId,
    allUnits: Unit[],
    visibleHexes: Set<HexCoordsId>
  ): Unit[] {
    const pidStr = String(playerId);

    return allUnits.filter((u) => {
      if (String(u.playerId) === pidStr) return true; // Own unit

      return visibleHexes.has(HexUtils.getCoordsID(u.location)); // Enemy unit on visible hex
    });
  },
};
