import { TerrainTypes } from "../types";
import { HexCoords } from "./geometry";

export interface GameMap {
  id: string;
  playerCount: number;
  victoryPointsToWin: number;
  hexes: {
    location: HexCoords,
    terrain: TerrainTypes
  }[];
  planets: {
    location: HexCoords,
    isCapital: boolean
  }[];
}
