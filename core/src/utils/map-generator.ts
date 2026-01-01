import { HexUtils } from "./hex-utils";
import { HexFactory, PlanetFactory } from "../factories";
import { UnifiedId } from "../types/unified-id";
import { GameMap } from "../types/game-map";
import { Hex } from "../types/hex";
import { Planet } from "../types/planet";
import { PLANET_NAMES } from "../data/names";

export const MapGenerator = {
  generateFromGameMap(
    gameId: UnifiedId,
    map: GameMap,
    idGenerator: () => UnifiedId
  ): {
    hexes: Hex[];
    planets: Planet[];
  } {
    const hexes: Hex[] = map.hexes.map((h) => {
      if (h.location == null) {
        throw new Error(`Map hex is invalid (location): ${JSON.stringify(h)}`);
      }
      if (h.terrain == null) {
        throw new Error(`Map hex is invalid (terrain): ${JSON.stringify(h)}`);
      }

      return HexFactory.create(gameId, h.location, h.terrain, idGenerator);
    });

    const planetNames = PLANET_NAMES.slice();

    const planets: Planet[] = map.planets.map((p) => {
      if (p.location == null) {
        throw new Error(
          `Map planet is invalid (location): ${JSON.stringify(p)}`
        );
      }
      if (p.isCapital == null) {
        throw new Error(
          `Map planet is invalid (isCapital): ${JSON.stringify(p)}`
        );
      }

      const hex = hexes.find((h) => HexUtils.equals(h.location, p.location))!;

      const planetName = planetNames.splice(
        Math.floor(Math.random() * planetNames.length),
        1
      )[0]!;

      const planet = PlanetFactory.create(
        gameId,
        hex._id,
        planetName,
        p.location,
        p.isCapital, // Note: This assumes players start with their capital planet ONLY.
        idGenerator
      );

      // Make sure to update the hex's planet id
      hex.planetId = planet._id;

      return planet;
    });

    return {
      hexes,
      planets,
    };
  },
};
