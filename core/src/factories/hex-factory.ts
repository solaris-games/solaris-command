import { Hex, HexCoords, TerrainTypes, UnifiedId } from "../types";

export const HexFactory = {
  create(
    gameId: UnifiedId,
    location: HexCoords,
    terrain: TerrainTypes,
    idGenerator: () => UnifiedId
  ): Hex {
    return {
      _id: idGenerator(),
      gameId,
      playerId: null,
      planetId: null, // We will update this later
      stationId: null,
      unitId: null,
      location,
      terrain,
      zoc: [],
    };
  },
};
