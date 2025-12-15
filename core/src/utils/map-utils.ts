import { ObjectId } from "mongodb";
import { Unit } from "../models/unit";
import { HexUtils } from "./hex-utils";
import { UNIT_CATALOG_ID_MAP } from "../data";
import { Hex, Planet, TerrainTypes } from "../models";
import { HexCoords, HexCoordsId } from "../types/geometry";
import { UnitManager } from "./unit-manager";
import { ZocMap } from "./pathfinding";

export const MapUtils = {
  /**
   * Generates a map of Zone of Control.
   * Key: Hex ID
   * Value: Set of Player IDs that exert ZOC into this hex.
   */
  calculateZOCMap(units: Unit[]): ZocMap {
    const zocMap = new Map<HexCoordsId, Set<string>>(); // Coord ID, Player Id

    for (const unit of units) {
      // Note: Fully suppressed units do not exert a ZOC.
      if (UnitManager.getActiveSteps(unit).length === 0) {
        continue;
      }

      // Note: Some units (e.g Frigates) do not exert a ZOC
      const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

      if (!unitCtlg.stats.zoc) {
        continue;
      }

      // 1. Get all adjacent hexes (ZOC projection)
      const neighbors = HexUtils.neighbors(unit.location);

      for (const neighbor of neighbors) {
        const hexId = HexUtils.getCoordsID(neighbor);

        if (!zocMap.has(hexId)) {
          zocMap.set(hexId, new Set<string>());
        }

        // Add this player to the ZOC set for this hex
        zocMap.get(hexId)!.add(String(unit.playerId));
      }
    }

    return zocMap;
  },

  /**
   * Check if a specific player is affected by ZOC in a target hex
   */
  isHexInEnemyZOC(
    hexCoordsId: HexCoordsId,
    playerId: ObjectId,
    zocMap: Map<HexCoordsId, Set<string>> // Coord ID, Player Id
  ): boolean {
    const exertors = zocMap.get(hexCoordsId);
    if (!exertors) return false;

    // If there is ANY player ID in the set that is NOT me, it is Enemy ZOC.
    for (const id of exertors) {
      if (id !== String(playerId)) return true;
    }

    return false;
  },

  isHexImpassable(hex: Hex): boolean {
    return (
      hex.terrain === TerrainTypes.GRAVITY_WELL ||
      hex.terrain === TerrainTypes.RADIATION_STORM
    );
  },

  findPlayerPlanets(planets: Planet[], playerId: ObjectId): Planet[] {
    return planets.filter((p) => String(p.playerId) === String(playerId));
  },

  findPlayerCapital(planets: Planet[], playerId: ObjectId): Planet | null {
    return (
      MapUtils.findPlayerPlanets(planets, playerId).find((p) => p.isCapital) ||
      null
    );
  },

  findUnownedCapital(planets: Planet[]): Planet | null {
    return planets.find((p) => p.isCapital && p.playerId === null) || null;
  },

  findNearestUnownedPlanet(
    planets: Planet[],
    center: HexCoords,
    excludePlanetId?: ObjectId
  ): Planet | null {
    let nearest: Planet | null = null;
    let minDistance = Infinity;

    for (const planet of planets) {
      if (planet.playerId) continue; // Must be unowned
      if (
        excludePlanetId &&
        String(planet._id) === String(excludePlanetId)
      )
        continue;

      const dist = HexUtils.distance(center, planet.location);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = planet;
      }
    }

    return nearest;
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
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
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
