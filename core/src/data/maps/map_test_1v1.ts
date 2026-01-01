import { GameMap, TerrainTypes } from "../../types";

export const GAME_MAP_TEST_1V1: GameMap = {
  id: "test_1v1",
  playerCount: 2,
  hexes: [
    {
      location: {
        q: -4,
        r: 0,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 1,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 2,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 3,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 4,
        s: 0,
      },
      terrain: TerrainTypes.GRAVITY_WELL,
    },
    {
      location: {
        q: -3,
        r: -1,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 0,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 1,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 2,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 3,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 4,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -2,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -1,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 0,
        s: 2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -2,
        r: 1,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 2,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 3,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 4,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -3,
        s: 4,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: -1,
        r: -2,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -1,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 0,
        s: 1,
      },
      terrain: TerrainTypes.INDUSTRIAL_ZONE,
    },
    {
      location: {
        q: -1,
        r: 1,
        s: 0,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -1,
        r: 2,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 3,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 4,
        s: -3,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 0,
        r: -4,
        s: 4,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 0,
        r: -3,
        s: 3,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: 0,
        r: -2,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -1,
        s: 1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: 0,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 1,
        s: -1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: 2,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 3,
        s: -3,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: 0,
        r: 4,
        s: -4,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 1,
        r: -4,
        s: 3,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 1,
        r: -3,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -2,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -1,
        s: 0,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 1,
        r: 0,
        s: -1,
      },
      terrain: TerrainTypes.INDUSTRIAL_ZONE,
    },
    {
      location: {
        q: 1,
        r: 1,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 2,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 3,
        s: -4,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 2,
        r: -4,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -3,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -2,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -1,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: 0,
        s: -2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 2,
        r: 1,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: 2,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -4,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -3,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -2,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -1,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 0,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 1,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -4,
        s: 0,
      },
      terrain: TerrainTypes.GRAVITY_WELL,
    },
    {
      location: {
        q: 4,
        r: -3,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -2,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -1,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 0,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
  ],
  planets: [
    {
      location: {
        q: -3,
        r: 0,
        s: 3,
      },
      isCapital: false,
    },
    {
      location: {
        q: -3,
        r: 3,
        s: 0,
      },
      isCapital: true,
    },
    {
      location: {
        q: 0,
        r: 0,
        s: 0,
      },
      isCapital: false,
    },
    {
      location: {
        q: 3,
        r: -3,
        s: 0,
      },
      isCapital: true,
    },
    {
      location: {
        q: 3,
        r: 0,
        s: -3,
      },
      isCapital: false,
    },
  ],
};
