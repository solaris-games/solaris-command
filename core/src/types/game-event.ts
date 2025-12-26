import { UnifiedId } from ".";

export interface GameEvent {
  _id: UnifiedId;
  gameId: UnifiedId;
  playerId: UnifiedId | null;

  tick: number;
  type: string;
  data: object;
}
