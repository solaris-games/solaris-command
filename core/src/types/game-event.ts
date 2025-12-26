import { UnifiedId } from ".";

export enum GameEventTypes {
  COMBAT_REPORT = "COMBAT_REPORT",
}

export interface GameEvent {
  _id: UnifiedId;
  gameId: UnifiedId;
  playerId: UnifiedId | null;

  tick: number;
  type: GameEventTypes;
  data: object;
}
