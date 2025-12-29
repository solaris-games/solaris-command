import { HexCoords, Planet, UnifiedId } from "../types";

export const PlanetFactory = {
  create(
    gameId: UnifiedId,
    hexId: UnifiedId,
    name: string,
    location: HexCoords,
    isCapital: boolean,
    idGenerator: () => UnifiedId
  ): Planet {
    return {
      _id: idGenerator(),
      gameId,
      hexId,
      playerId: null,
      name,
      location: location,
      isCapital: isCapital,
      supply: {
        isInSupply: isCapital, // Note: This assumes players start with their capital planet ONLY.
        isRoot: isCapital,
      },
    };
  },
};
