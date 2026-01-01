import { GameMap, TerrainTypes } from "../../types";
import { CONSTANTS } from "../constants";

export const GAME_MAP_TEST_4_PLAYERS: GameMap = {
  id: "test_4_players",
  playerCount: 4,
  victoryPointsToWin: CONSTANTS.GAME_DEFAULT_VICTORY_POINTS_TO_WIN,
  hexes: [
    {
      location: {
        q: -8,
        r: 0,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 1,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 2,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 3,
        s: 5,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: -8,
        r: 4,
        s: 4,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -8,
        r: 5,
        s: 3,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -8,
        r: 6,
        s: 2,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -8,
        r: 7,
        s: 1,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: -8,
        r: 8,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: -1,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 0,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 1,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 2,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 3,
        s: 4,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: -7,
        r: 4,
        s: 3,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -7,
        r: 5,
        s: 2,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -7,
        r: 6,
        s: 1,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: -7,
        r: 7,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 8,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: -2,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: -1,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 0,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 1,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 2,
        s: 4,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: -6,
        r: 3,
        s: 3,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -6,
        r: 4,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 5,
        s: 1,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -6,
        r: 6,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 7,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 8,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: -3,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: -2,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: -1,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: 0,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: 1,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: 2,
        s: 3,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -5,
        r: 3,
        s: 2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 4,
        s: 1,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -5,
        r: 5,
        s: 0,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: -5,
        r: 6,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: 7,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: 8,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -4,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -3,
        s: 7,
      },
      terrain: TerrainTypes.INDUSTRIAL_ZONE,
    },
    {
      location: {
        q: -4,
        r: -2,
        s: 6,
      },
      terrain: TerrainTypes.INDUSTRIAL_ZONE,
    },
    {
      location: {
        q: -4,
        r: -1,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
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
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -4,
        r: 2,
        s: 2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -4,
        r: 3,
        s: 1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -4,
        r: 4,
        s: 0,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -4,
        r: 5,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 6,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 7,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 8,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -5,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -4,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -3,
        s: 6,
      },
      terrain: TerrainTypes.INDUSTRIAL_ZONE,
    },
    {
      location: {
        q: -3,
        r: -2,
        s: 5,
      },
      terrain: TerrainTypes.INDUSTRIAL_ZONE,
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
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -3,
        r: 2,
        s: 1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -3,
        r: 3,
        s: 0,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -3,
        r: 4,
        s: -1,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -3,
        r: 5,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 6,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 7,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 8,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -6,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -5,
        s: 7,
      },
      terrain: TerrainTypes.INDUSTRIAL_ZONE,
    },
    {
      location: {
        q: -2,
        r: -4,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -3,
        s: 5,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
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
      terrain: TerrainTypes.GRAVITY_WELL,
    },
    {
      location: {
        q: -2,
        r: 1,
        s: 1,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -2,
        r: 2,
        s: 0,
      },
      terrain: TerrainTypes.NEBULA,
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
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -2,
        r: 5,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 6,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 7,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 8,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -7,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -6,
        s: 7,
      },
      terrain: TerrainTypes.INDUSTRIAL_ZONE,
    },
    {
      location: {
        q: -1,
        r: -5,
        s: 6,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -1,
        r: -4,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -3,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: -1,
        r: 0,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 1,
        s: 0,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -1,
        r: 2,
        s: -1,
      },
      terrain: TerrainTypes.GRAVITY_WELL,
    },
    {
      location: {
        q: -1,
        r: 3,
        s: -2,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -1,
        r: 4,
        s: -3,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: -1,
        r: 5,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 6,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 7,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 8,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -8,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -7,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -6,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -5,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -4,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -3,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -2,
        s: 2,
      },
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: 0,
        r: -1,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.GAS_CLOUD,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 5,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 6,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 7,
        s: -7,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 0,
        r: 8,
        s: -8,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 1,
        r: -8,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -7,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -6,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -5,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -4,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.GRAVITY_WELL,
    },
    {
      location: {
        q: 1,
        r: -1,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 0,
        s: -1,
      },
      terrain: TerrainTypes.NEBULA,
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
      terrain: TerrainTypes.NEBULA,
    },
    {
      location: {
        q: 1,
        r: 3,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 4,
        s: -5,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 1,
        r: 5,
        s: -6,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 1,
        r: 6,
        s: -7,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 1,
        r: 7,
        s: -8,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 2,
        r: -8,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -7,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -6,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -5,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.GAS_CLOUD,
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
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: 2,
        r: 0,
        s: -2,
      },
      terrain: TerrainTypes.GRAVITY_WELL,
    },
    {
      location: {
        q: 2,
        r: 1,
        s: -3,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: 2,
        r: 2,
        s: -4,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 2,
        r: 3,
        s: -5,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 2,
        r: 4,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: 5,
        s: -7,
      },
      terrain: TerrainTypes.RADIATION_STORM,
    },
    {
      location: {
        q: 2,
        r: 6,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -8,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -7,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -6,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -5,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -4,
        s: 1,
      },
      terrain: TerrainTypes.GAS_CLOUD,
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
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: 3,
        r: -1,
        s: -2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 3,
        r: 0,
        s: -3,
      },
      terrain: TerrainTypes.NEBULA,
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
        q: 3,
        r: 2,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 3,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 4,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 5,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -8,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -7,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -6,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -5,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -4,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -3,
        s: -1,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 4,
        r: -2,
        s: -2,
      },
      terrain: TerrainTypes.GAS_CLOUD,
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
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: 4,
        r: 1,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 2,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 3,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 4,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -8,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -7,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -6,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -5,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -4,
        s: -1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: -3,
        s: -2,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: 5,
        r: -2,
        s: -3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: -1,
        s: -4,
      },
      terrain: TerrainTypes.GAS_CLOUD,
    },
    {
      location: {
        q: 5,
        r: 0,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 1,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 2,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 3,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -8,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -7,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -6,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -5,
        s: -1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: -4,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -3,
        s: -3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: -2,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -1,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: 0,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: 1,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: 2,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -8,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -7,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -6,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -5,
        s: -2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: -4,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -3,
        s: -4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: -2,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -1,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: 0,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: 1,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -8,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -7,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -6,
        s: -2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 8,
        r: -5,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -4,
        s: -4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 8,
        r: -3,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -2,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -1,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: 0,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
  ],
  planets: [
    {
      location: {
        q: -6,
        r: 0,
        s: 6,
      },
      isCapital: true,
    },
    {
      location: {
        q: -6,
        r: 4,
        s: 2,
      },
      isCapital: false,
    },
    {
      location: {
        q: -3,
        r: 6,
        s: -3,
      },
      isCapital: true,
    },
    {
      location: {
        q: -2,
        r: -4,
        s: 6,
      },
      isCapital: false,
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
        q: 2,
        r: 4,
        s: -6,
      },
      isCapital: false,
    },
    {
      location: {
        q: 3,
        r: -6,
        s: 3,
      },
      isCapital: true,
    },
    {
      location: {
        q: 6,
        r: -4,
        s: -2,
      },
      isCapital: false,
    },
    {
      location: {
        q: 6,
        r: 0,
        s: -6,
      },
      isCapital: true,
    },
  ],
};
