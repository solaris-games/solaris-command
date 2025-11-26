import { ObjectId } from "mongodb";

export interface GameEvent {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId | null;

  tick: number;
  type: string;
  data: object;
}
