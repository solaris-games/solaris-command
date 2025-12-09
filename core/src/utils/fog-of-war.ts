import { HexCoords } from "../types";
import { HexUtils } from "./hex-utils";
import { Unit } from "../models/unit";
import { Planet } from "../models/planet";
import { Station } from "../models/station";
import { ObjectId } from "mongodb";
import { CONSTANTS, UNIT_CATALOG_ID_MAP } from "../data";

export const FogOfWar = {
  /**
   * Calculates the set of visible hex IDs for a given player.
   * Based on the location of their Units, Planets, and Stations.
   */
  getVisibleHexes(
    playerId: string | ObjectId,
    units: Unit[],
    planets: Planet[],
    stations: Station[]
  ): Set<string> {
    const visibleHexes = new Set<string>();
    const pidStr = playerId.toString();

    // 1. Units
    units.forEach((u) => {
      if (u.playerId.toString() === pidStr) {
        const unitCtlg = UNIT_CATALOG_ID_MAP.get(u.catalogId)!;
        const hexes = HexUtils.getHexCoordsInRange(
          u.location,
          unitCtlg.stats.los
        );
        hexes.forEach((h) => visibleHexes.add(HexUtils.getCoordsID(h)));
      }
    });

    // 2. Planets
    planets.forEach((p) => {
      if (p.playerId && p.playerId.toString() === pidStr) {
        const hexes = HexUtils.getHexCoordsInRange(p.location, CONSTANTS.PLANET_VISION_RANGE);
        hexes.forEach((h) => visibleHexes.add(HexUtils.getCoordsID(h)));
      }
    });

    // 3. Stations
    stations.forEach((s) => {
      if (s.playerId && s.playerId.toString() === pidStr) {
        const hexes = HexUtils.getHexCoordsInRange(s.location, CONSTANTS.STATION_VISION_RANGE);
        hexes.forEach((h) => visibleHexes.add(HexUtils.getCoordsID(h)));
      }
    });

    return visibleHexes;
  },

  /**
   * Filters units based on visibility.
   * Returns:
   *  - All units owned by the player
   *  - Enemy units that are on visible hexes
   */
  filterVisibleUnits(
    playerId: string | ObjectId,
    allUnits: Unit[],
    visibleHexes: Set<string>
  ): Unit[] {
    const pidStr = playerId.toString();
    return allUnits.filter((u) => {
      if (u.playerId.toString() === pidStr) return true; // Own unit
      return visibleHexes.has(HexUtils.getCoordsID(u.location)); // Enemy unit on visible hex
    });
  },
};
