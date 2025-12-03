import { ObjectId } from "mongodb";

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  DEFEATED = 'DEFEATED'
};

export interface Player {
  _id: ObjectId;
  gameId: ObjectId;
  userId: ObjectId;

  alias: string;
  color: string; // Hex code e.g., "#FF0000"

  status: PlayerStatus
  prestigePoints: number; // Used to purchase units
  victoryPoints: number;

  lastSeenDate: Date;
}
