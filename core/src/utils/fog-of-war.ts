import { HexCoords } from "../types";
import { HexUtils } from "./hex-utils";
import { Unit } from "../models/unit";
import { Planet } from "../models/planet";
import { Station } from "../models/station";
import { ObjectId } from "mongodb";

export const FogOfWar = {
  /**
   * Calculates the set of visible hex IDs for a given player.
   * Based on the location of their Units, Planets, and Stations.
   */
  getVisibleHexes(
    playerId: string | ObjectId,
    units: Unit[],
    planets: Planet[],
    stations: Station[],
    visionRange: number = 2 // Default vision range for all entities
  ): Set<string> {
    const visibleHexes = new Set<string>();
    const pidStr = playerId.toString();

    // 1. Units
    units.forEach((u) => {
      if (u.playerId.toString() === pidStr) {
        const hexes = HexUtils.getHexesInRange(u.location, visionRange);
        hexes.forEach((h) => visibleHexes.add(HexUtils.getID(h)));
      }
    });

    // 2. Planets (Assume always visible range 2 or more?)
    planets.forEach((p) => {
      if (p.playerId && p.playerId.toString() === pidStr) {
        const hexes = HexUtils.getHexesInRange(p.location, visionRange);
        hexes.forEach((h) => visibleHexes.add(HexUtils.getID(h)));
      }
    });

    // 3. Stations
    stations.forEach((s) => {
      if (s.playerId.toString() === pidStr) {
        // Active stations might have more range? sticking to default for now
        const hexes = HexUtils.getHexesInRange(s.location, visionRange);
        hexes.forEach((h) => visibleHexes.add(HexUtils.getID(h)));
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
      return visibleHexes.has(HexUtils.getID(u.location)); // Enemy unit on visible hex
    });
  },
};
