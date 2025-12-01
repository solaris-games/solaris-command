import { ObjectId } from "mongodb";
import { Unit } from "../models/unit";
import { HexUtils } from "./hex-utils";
import { UNIT_CATALOG_ID_MAP } from "../data";

export const MapUtils = {
  /**
   * Generates a map of Zone of Control.
   * Key: Hex ID
   * Value: Set of Player IDs that exert ZOC into this hex.
   */
  calculateZOCMap(units: Unit[]): Map<string, Set<string>> {
    const zocMap = new Map<string, Set<string>>();

    for (const unit of units) {
      // Note: Fully suppressed units do not exert a ZOC.
      if (unit.state.activeSteps === 0) {
        continue;
      }

      // Note: Some units (e.g Frigates) do not exert a ZOC
      const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

      if (!unitCtlg.stats.hasZOC) {
        continue;
      }

      // TODO: Should ZOC only affect hexes owned by that player?

      // 1. Get all adjacent hexes (ZOC projection)
      const neighbors = HexUtils.neighbors(unit.location);

      for (const neighbor of neighbors) {
        const hexId = HexUtils.getID(neighbor);

        if (!zocMap.has(hexId)) {
          zocMap.set(hexId, new Set<string>());
        }

        // Add this player to the ZOC set for this hex
        zocMap.get(hexId)!.add(unit.playerId.toString());
      }
    }

    return zocMap;
  },

  /**
   * Check if a specific player is affected by ZOC in a target hex
   */
  isHexInEnemyZOC(
    hexId: string,
    playerId: string,
    zocMap: Map<string, Set<string>>
  ): boolean {
    const exertors = zocMap.get(hexId);
    if (!exertors) return false;

    // If there is ANY player ID in the set that is NOT me, it is Enemy ZOC.
    for (const id of exertors) {
      if (id !== playerId) return true;
    }

    return false;
  },
};
