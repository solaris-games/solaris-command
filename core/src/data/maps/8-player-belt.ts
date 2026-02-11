import { GameMap, TerrainTypes } from "../../types";
import { CONSTANTS } from "../constants";

export const GAME_MAP_8_PLAYER_BELT: GameMap = {
  id: "8-player-belt",
  name: "Belt",
  playerCount: 8,
  victoryPointsToWin: CONSTANTS.GAME_DEFAULT_VICTORY_POINTS_TO_WIN,
  hexes: [
    {
      location: {
        q: -16,
        r: 0,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 1,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 2,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 3,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 4,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 5,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 6,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 7,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 8,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 9,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 10,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 11,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 12,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 13,
        s: 3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -16,
        r: 14,
        s: 2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -16,
        r: 15,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -16,
        r: 16,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: -1,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 0,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 1,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 2,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 3,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 4,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 5,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 6,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 7,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 8,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 9,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 10,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 11,
        s: 4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -15,
        r: 12,
        s: 3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -15,
        r: 13,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 14,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 15,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -15,
        r: 16,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: -2,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: -1,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 0,
        s: 14,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -14,
        r: 1,
        s: 13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -14,
        r: 2,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 3,
        s: 11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -14,
        r: 4,
        s: 10,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -14,
        r: 5,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 6,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 7,
        s: 7,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -14,
        r: 8,
        s: 6,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -14,
        r: 9,
        s: 5,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -14,
        r: 10,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 11,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 12,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 13,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 14,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 15,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -14,
        r: 16,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: -3,
        s: 16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -13,
        r: -2,
        s: 15,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -13,
        r: -1,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 0,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 1,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 2,
        s: 11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -13,
        r: 3,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 4,
        s: 9,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -13,
        r: 5,
        s: 8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -13,
        r: 6,
        s: 7,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -13,
        r: 7,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 8,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 9,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 10,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 11,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 12,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 13,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 14,
        s: -1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -13,
        r: 15,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -13,
        r: 16,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: -4,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: -3,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: -2,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: -1,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 0,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 1,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 2,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 3,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 4,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 5,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 6,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 7,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 8,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 9,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 10,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 11,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 12,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 13,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -12,
        r: 14,
        s: -2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -12,
        r: 15,
        s: -3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -12,
        r: 16,
        s: -4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -11,
        r: -5,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: -4,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: -3,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: -2,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: -1,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 0,
        s: 11,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -11,
        r: 1,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 2,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 3,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 4,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 5,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 6,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 7,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 8,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 9,
        s: 2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -11,
        r: 10,
        s: 1,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -11,
        r: 11,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 12,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 13,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 14,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 15,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -11,
        r: 16,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: -6,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: -5,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: -4,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: -3,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: -2,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: -1,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 0,
        s: 10,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -10,
        r: 1,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 2,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 3,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 4,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 5,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 6,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 7,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 8,
        s: 2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -10,
        r: 9,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 10,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 11,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 12,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 13,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 14,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 15,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -10,
        r: 16,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: -7,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: -6,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: -5,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: -4,
        s: 13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -9,
        r: -3,
        s: 12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -9,
        r: -2,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: -1,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 0,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 1,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 2,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 3,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 4,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 5,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 6,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 7,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 8,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 9,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 10,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 11,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 12,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 13,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 14,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 15,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -9,
        r: 16,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: -8,
        s: 16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -8,
        r: -7,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: -6,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: -5,
        s: 13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -8,
        r: -4,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: -3,
        s: 11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -8,
        r: -2,
        s: 10,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -8,
        r: -1,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 4,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 5,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 6,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 7,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
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
        q: -8,
        r: 9,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 10,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 11,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 12,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 13,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 14,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -8,
        r: 15,
        s: -7,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -8,
        r: 16,
        s: -8,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -7,
        r: -9,
        s: 16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -7,
        r: -8,
        s: 15,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -7,
        r: -7,
        s: 14,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -7,
        r: -6,
        s: 13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -7,
        r: -5,
        s: 12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -7,
        r: -4,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: -3,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: -2,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: -1,
        s: 8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -7,
        r: 0,
        s: 7,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 4,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 5,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 6,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
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
        q: -7,
        r: 9,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 10,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 11,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 12,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 13,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 14,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 15,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -7,
        r: 16,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: -10,
        s: 16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: -9,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: -8,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: -7,
        s: 13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: -6,
        s: 12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: -5,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: -4,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: -3,
        s: 9,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: 1,
        s: 5,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: 2,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 3,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 4,
        s: 2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: 5,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
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
        q: -6,
        r: 9,
        s: -3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: 10,
        s: -4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: 11,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 12,
        s: -6,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: 13,
        s: -7,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -6,
        r: 14,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 15,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -6,
        r: 16,
        s: -10,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: -11,
        s: 16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: -10,
        s: 15,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: -9,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: -8,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: -7,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: -6,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: -5,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: -4,
        s: 9,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 2,
        s: 3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 5,
        s: 0,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 6,
        s: -1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 9,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: 10,
        s: -5,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 11,
        s: -6,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 12,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: 13,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -5,
        r: 14,
        s: -9,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 15,
        s: -10,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -5,
        r: 16,
        s: -11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -4,
        r: -12,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -11,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -10,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -9,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -8,
        s: 12,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -4,
        r: -7,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -6,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -5,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: -4,
        s: 8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -4,
        r: -3,
        s: 7,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -4,
        r: -2,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 5,
        s: -1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -4,
        r: 6,
        s: -2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
        q: -4,
        r: 9,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 10,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 11,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 12,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 13,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 14,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -4,
        r: 15,
        s: -11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -4,
        r: 16,
        s: -12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -3,
        r: -13,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -12,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -11,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -10,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -9,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -8,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -7,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -6,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: -5,
        s: 8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -3,
        r: -2,
        s: 5,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -3,
        r: -1,
        s: 4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
        q: -3,
        r: 9,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 10,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 11,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 12,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 13,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 14,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 15,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -3,
        r: 16,
        s: -13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -2,
        r: -14,
        s: 16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -13,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -12,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -11,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -10,
        s: 12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -2,
        r: -9,
        s: 11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -2,
        r: -8,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: -7,
        s: 9,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -2,
        r: -6,
        s: 8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -2,
        r: -5,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
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
        q: -2,
        r: 9,
        s: -7,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: -2,
        r: 10,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 11,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 12,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 13,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 14,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 15,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -2,
        r: 16,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -15,
        s: 16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -1,
        r: -14,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -13,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -12,
        s: 13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -1,
        r: -11,
        s: 12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: -1,
        r: -10,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -9,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -8,
        s: 9,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: -5,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
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
        q: -1,
        r: 9,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 10,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 11,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 12,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 13,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 14,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 15,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: -1,
        r: 16,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -16,
        s: 16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: -15,
        s: 15,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: -14,
        s: 14,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: -13,
        s: 13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: -12,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -11,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -10,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: -9,
        s: 9,
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
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 0,
        r: -3,
        s: 3,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 0,
        r: -2,
        s: 2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 2,
        s: -2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 0,
        r: 3,
        s: -3,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 0,
        r: 4,
        s: -4,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 8,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 9,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 10,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 11,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 12,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 0,
        r: 13,
        s: -13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: 14,
        s: -14,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: 15,
        s: -15,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 0,
        r: 16,
        s: -16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 1,
        r: -16,
        s: 15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -15,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -14,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -13,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -12,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -11,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -10,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: -9,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 4,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 5,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 6,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 7,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 8,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 9,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 10,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 11,
        s: -12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 1,
        r: 12,
        s: -13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 1,
        r: 13,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 14,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 1,
        r: 15,
        s: -16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 2,
        r: -16,
        s: 14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -15,
        s: 13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -14,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -13,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -12,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -11,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -10,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: -9,
        s: 7,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
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
      terrain: TerrainTypes.EMPTY,
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
        q: 2,
        r: 3,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: 6,
        s: -8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 2,
        r: 7,
        s: -9,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 2,
        r: 8,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: 9,
        s: -11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 2,
        r: 10,
        s: -12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 2,
        r: 11,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: 12,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: 13,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 2,
        r: 14,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -16,
        s: 13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 3,
        r: -15,
        s: 12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -14,
        s: 11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -13,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -12,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -11,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -10,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: -9,
        s: 6,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 3,
        r: 2,
        s: -5,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 3,
        r: 3,
        s: -6,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 3,
        r: 6,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 7,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 8,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 9,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 10,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 11,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 12,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 3,
        r: 13,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -16,
        s: 12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 4,
        r: -15,
        s: 11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 4,
        r: -14,
        s: 10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -13,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -12,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -11,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -10,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: -9,
        s: 5,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 4,
        r: -5,
        s: 1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 4,
        r: 4,
        s: -8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 4,
        r: 5,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 6,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 7,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 8,
        s: -12,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 4,
        r: 9,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 10,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 11,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 4,
        r: 12,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -16,
        s: 11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: -15,
        s: 10,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: -14,
        s: 9,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: -13,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -12,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -11,
        s: 6,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: -10,
        s: 5,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: -9,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: -8,
        s: 3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: -5,
        s: 0,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
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
        q: 5,
        r: 4,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 5,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 6,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 7,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 8,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 9,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 5,
        r: 10,
        s: -15,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 5,
        r: 11,
        s: -16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: -16,
        s: 10,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: -15,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -14,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -13,
        s: 7,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: -12,
        s: 6,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: -11,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -10,
        s: 4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: -9,
        s: 3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: -4,
        s: -2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: -3,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: 0,
        s: -6,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
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
        q: 6,
        r: 3,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: 4,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: 5,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: 6,
        s: -12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: 7,
        s: -13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 6,
        r: 8,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: 9,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 6,
        r: 10,
        s: -16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: -16,
        s: 9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -15,
        s: 8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -14,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -13,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -12,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -11,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -10,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: -9,
        s: 2,
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
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: 1,
        s: -8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: 2,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: 3,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: 4,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 7,
        r: 5,
        s: -12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: 6,
        s: -13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: 7,
        s: -14,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: 8,
        s: -15,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 7,
        r: 9,
        s: -16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 8,
        r: -16,
        s: 8,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 8,
        r: -15,
        s: 7,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 8,
        r: -14,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -13,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -12,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -11,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -10,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: -9,
        s: 1,
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
      terrain: TerrainTypes.EMPTY,
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
      terrain: TerrainTypes.EMPTY,
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
    {
      location: {
        q: 8,
        r: 1,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: 2,
        s: -10,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 8,
        r: 3,
        s: -11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 8,
        r: 4,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: 5,
        s: -13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 8,
        r: 6,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: 7,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 8,
        r: 8,
        s: -16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 9,
        r: -16,
        s: 7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -15,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -14,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -13,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -12,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -11,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -10,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -9,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -8,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -7,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -6,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -5,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -4,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -3,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -2,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: -1,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: 0,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: 1,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: 2,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: 3,
        s: -12,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 9,
        r: 4,
        s: -13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 9,
        r: 5,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: 6,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 9,
        r: 7,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -16,
        s: 6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -15,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -14,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -13,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -12,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -11,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -10,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -9,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -8,
        s: -2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 10,
        r: -7,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -6,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -5,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -4,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -3,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -2,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: -1,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: 0,
        s: -10,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 10,
        r: 1,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: 2,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: 3,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: 4,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: 5,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 10,
        r: 6,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -16,
        s: 5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -15,
        s: 4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -14,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -13,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -12,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -11,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -10,
        s: -1,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 11,
        r: -9,
        s: -2,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 11,
        r: -8,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -7,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -6,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -5,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -4,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -3,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -2,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: -1,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: 0,
        s: -11,
      },
      terrain: TerrainTypes.DEBRIS_FIELD,
    },
    {
      location: {
        q: 11,
        r: 1,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: 2,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: 3,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: 4,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 11,
        r: 5,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -16,
        s: 4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 12,
        r: -15,
        s: 3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 12,
        r: -14,
        s: 2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 12,
        r: -13,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -12,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -11,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -10,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -9,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -8,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -7,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -6,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -5,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -4,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -3,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -2,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: -1,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: 0,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: 1,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: 2,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: 3,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 12,
        r: 4,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -16,
        s: 3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -15,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -14,
        s: 1,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 13,
        r: -13,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -12,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -11,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -10,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -9,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -8,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -7,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -6,
        s: -7,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 13,
        r: -5,
        s: -8,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 13,
        r: -4,
        s: -9,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 13,
        r: -3,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: -2,
        s: -11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 13,
        r: -1,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: 0,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: 1,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 13,
        r: 2,
        s: -15,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 13,
        r: 3,
        s: -16,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 14,
        r: -16,
        s: 2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -15,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -14,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -13,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -12,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -11,
        s: -3,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -10,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -9,
        s: -5,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 14,
        r: -8,
        s: -6,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 14,
        r: -7,
        s: -7,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 14,
        r: -6,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -5,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -4,
        s: -10,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 14,
        r: -3,
        s: -11,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 14,
        r: -2,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: -1,
        s: -13,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 14,
        r: 0,
        s: -14,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 14,
        r: 1,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 14,
        r: 2,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -16,
        s: 1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -15,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -14,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -13,
        s: -2,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -12,
        s: -3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 15,
        r: -11,
        s: -4,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 15,
        r: -10,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -9,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -8,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -7,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -6,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -5,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -4,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -3,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -2,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: -1,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: 0,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 15,
        r: 1,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -16,
        s: 0,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -15,
        s: -1,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -14,
        s: -2,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 16,
        r: -13,
        s: -3,
      },
      terrain: TerrainTypes.ASTEROID_FIELD,
    },
    {
      location: {
        q: 16,
        r: -12,
        s: -4,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -11,
        s: -5,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -10,
        s: -6,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -9,
        s: -7,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -8,
        s: -8,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -7,
        s: -9,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -6,
        s: -10,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -5,
        s: -11,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -4,
        s: -12,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -3,
        s: -13,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -2,
        s: -14,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: -1,
        s: -15,
      },
      terrain: TerrainTypes.EMPTY,
    },
    {
      location: {
        q: 16,
        r: 0,
        s: -16,
      },
      terrain: TerrainTypes.EMPTY,
    },
  ],
  planets: [
    {
      location: {
        q: -15,
        r: 0,
        s: 15,
      },
      isCapital: false,
    },
    {
      location: {
        q: -14,
        r: 5,
        s: 9,
      },
      isCapital: false,
    },
    {
      location: {
        q: -13,
        r: 15,
        s: -2,
      },
      isCapital: false,
    },
    {
      location: {
        q: -10,
        r: -5,
        s: 15,
      },
      isCapital: false,
    },
    {
      location: {
        q: -10,
        r: 4,
        s: 6,
      },
      isCapital: true,
    },
    {
      location: {
        q: -10,
        r: 12,
        s: -2,
      },
      isCapital: true,
    },
    {
      location: {
        q: -9,
        r: 8,
        s: 1,
      },
      isCapital: false,
    },
    {
      location: {
        q: -6,
        r: -4,
        s: 10,
      },
      isCapital: true,
    },
    {
      location: {
        q: -6,
        r: 15,
        s: -9,
      },
      isCapital: false,
    },
    {
      location: {
        q: -4,
        r: -1,
        s: 5,
      },
      isCapital: false,
    },
    {
      location: {
        q: -4,
        r: 9,
        s: -5,
      },
      isCapital: false,
    },
    {
      location: {
        q: -2,
        r: -13,
        s: 15,
      },
      isCapital: false,
    },
    {
      location: {
        q: -2,
        r: 1,
        s: 1,
      },
      isCapital: false,
    },
    {
      location: {
        q: -2,
        r: 12,
        s: -10,
      },
      isCapital: true,
    },
    {
      location: {
        q: -1,
        r: -5,
        s: 6,
      },
      isCapital: false,
    },
    {
      location: {
        q: 1,
        r: 5,
        s: -6,
      },
      isCapital: false,
    },
    {
      location: {
        q: 2,
        r: -12,
        s: 10,
      },
      isCapital: true,
    },
    {
      location: {
        q: 2,
        r: -1,
        s: -1,
      },
      isCapital: false,
    },
    {
      location: {
        q: 2,
        r: 13,
        s: -15,
      },
      isCapital: false,
    },
    {
      location: {
        q: 4,
        r: -9,
        s: 5,
      },
      isCapital: false,
    },
    {
      location: {
        q: 4,
        r: 1,
        s: -5,
      },
      isCapital: false,
    },
    {
      location: {
        q: 6,
        r: -15,
        s: 9,
      },
      isCapital: false,
    },
    {
      location: {
        q: 6,
        r: 4,
        s: -10,
      },
      isCapital: true,
    },
    {
      location: {
        q: 9,
        r: -8,
        s: -1,
      },
      isCapital: false,
    },
    {
      location: {
        q: 10,
        r: -12,
        s: 2,
      },
      isCapital: true,
    },
    {
      location: {
        q: 10,
        r: -4,
        s: -6,
      },
      isCapital: true,
    },
    {
      location: {
        q: 10,
        r: 5,
        s: -15,
      },
      isCapital: false,
    },
    {
      location: {
        q: 13,
        r: -15,
        s: 2,
      },
      isCapital: false,
    },
    {
      location: {
        q: 14,
        r: -5,
        s: -9,
      },
      isCapital: false,
    },
    {
      location: {
        q: 15,
        r: 0,
        s: -15,
      },
      isCapital: false,
    },
  ],
};
