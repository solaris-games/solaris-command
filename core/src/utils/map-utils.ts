import { ObjectId } from "mongodb";
import { Unit } from "../models/unit";
import { HexUtils } from "./hex-utils";
import { TERRAIN_MP_COSTS, UNIT_CATALOG_ID_MAP } from "../data";
import { Hex, Planet, TerrainTypes } from "../models";
import { HexCoords, HexCoordsId } from "../types/geometry";

export const MapUtils = {
  /**
   * Calculates the MP cost for the player to move a unit into a hex. Accounts for ZOC influence.
   */
  getHexMPCost(hex: Hex, playerId: ObjectId | null) {
    let mpCost = TERRAIN_MP_COSTS[hex.terrain];

    if (playerId && MapUtils.isHexInEnemyZOC(hex, playerId)) {
      mpCost *= 2;
    }

    return mpCost;
  },

  /**
   * Check if a specific player is affected by ZOC in a target hex
   */
  isHexInEnemyZOC(hex: Hex, playerId: ObjectId) {
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

      if (hex) {
        const existing = hex.zoc.findIndex(
          (z) => String(z.unitId) === String(unit._id)
        );

        if (existing > -1) {
          hex.zoc.splice(existing, 1);
        }
      }
    });
  },

  addUnitHexZOC(unit: Unit, hexLookup: Map<HexCoordsId, Hex>) {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

    // Do not need to do this if unit doesn't project a ZOC.
    if (!unitCtlg.stats.zoc) {
      return;
    }

    // TODO: Flip adjacent EMPTY hexes that are not in enemy ZOC and are not planets or stations.
    // TODO: Only if recon spec?
    // TODO: Is it ok to do this sequentially? I don't think we can?

    // Get all of the neighbors (plus the current hex) and add ZOC influence
    const ZOCCoords = HexUtils.neighbors(unit.location).concat([unit.location]);

    ZOCCoords.forEach((coords) => {
      const hex = hexLookup.get(HexUtils.getCoordsID(coords));

      if (hex) {
        const existing = hex.zoc.find(
          (z) => String(z.unitId) === String(unit._id)
        );

        if (!existing) {
          hex.zoc.push({
            playerId: unit.playerId,
            unitId: unit._id,
          });
        }
      }
    });
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
      if (excludePlanetId && String(planet._id) === String(excludePlanetId))
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
