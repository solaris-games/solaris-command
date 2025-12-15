import { TerrainTypes } from "../models";
import { HexCoords } from "./geometry";

export interface GameMap {
  id: string;
  playerCount: number;
  hexes: {
    location: HexCoords,
    terrain: TerrainTypes
  }[];
  planets: {
    location: HexCoords,
    isCapital: boolean
  }[];
}
