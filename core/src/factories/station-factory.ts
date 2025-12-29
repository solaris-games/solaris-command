import { UnifiedId, HexCoords, Station } from "../types";

export class StationFactory {
  static create(
    gameId: UnifiedId,
    playerId: UnifiedId,
    hexId: UnifiedId,
    location: HexCoords,
    idGenerator: () => UnifiedId
  ): Station {
    const station: Station = {
      _id: idGenerator(),
      gameId: gameId,
      playerId: playerId,
      hexId: hexId,
      location: location,
      supply: {
        isInSupply: true,
        isRoot: false,
      },
    };

    return station;
  }
}
