import {
  UnifiedId,
  GameEvent,
  GameEventTypes,
} from "../types";

export class GameEventFactory {
  static create(
    gameId: UnifiedId,
    playerId: UnifiedId | null,
    tick: number,
    cycle: number,
    type: GameEventTypes,
    data: any,
    idGenerator: () => UnifiedId
  ): GameEvent {
    const gameEvent: GameEvent = {
      _id: idGenerator(),
      gameId,
      playerId,
      tick,
      cycle,
      type,
      data,
    };

    return gameEvent;
  }
}
