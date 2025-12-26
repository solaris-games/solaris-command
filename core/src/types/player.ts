import { UnifiedId } from "../types";

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  DEFEATED = 'DEFEATED'
};

export interface Player {
  _id: UnifiedId;
  gameId: UnifiedId;
  userId: UnifiedId;

  alias: string;
  color: string; // Hex code e.g., "#FF0000"

  status: PlayerStatus
  prestigePoints: number; // Used to purchase units
  victoryPoints: number;

  lastSeenDate: Date;
}
