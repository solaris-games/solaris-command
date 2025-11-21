import { ObjectId } from 'mongodb';

export interface Player {
  _id: ObjectId;
  gameId: ObjectId;
  userId: ObjectId;
  
  alias: string;
  color: string;    // Hex code e.g., "#FF0000"

  isDefeated: boolean;
  prestigePoints: number; // Used to purchase units
  victoryPoints: number;
  
  lastSeenDate: Date;
  lastSeenIP: string;
}