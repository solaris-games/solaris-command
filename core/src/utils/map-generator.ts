import { ObjectId } from "mongodb";
import { Hex, Planet } from "../models";
import { GameMap } from "../types";
import { PLANET_NAMES } from "../data";

export const MapGenerator = {
  generateFromGameMap(
    gameId: ObjectId,
    map: GameMap
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

      return {
        _id: new ObjectId(),
        gameId,
        unitId: null,
        playerId: null,
        location: h.location!,
        terrain: h.terrain!,
      };
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

      const name = planetNames.splice(
        Math.floor(Math.random() * planetNames.length),
        1
      )[0]!;

      return {
        _id: new ObjectId(),
        gameId,
        playerId: null,
        name,
        location: p.location!,
        isCapital: p.isCapital!,
        supply: {
          isInSupply: p.isCapital!, // Note: This assumes players start with their capital planet ONLY.
          isRoot: p.isCapital!,
        },
      };
    });

    return {
      hexes,
      planets,
    };
  },
};
