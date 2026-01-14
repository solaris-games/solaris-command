import { UnifiedId } from "../types/unified-id";

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  DEFEATED = 'DEFEATED',
  AFK = 'AFK'
};

export interface Player {
  _id: UnifiedId;
  gameId: UnifiedId;
  userId: UnifiedId;

  alias: string;
  color: string; // Colour key, e.g olive-reef-gold

  status: PlayerStatus
  prestigePoints: number; // Used to purchase units
  victoryPoints: number;
  renownToDistribute: number;

  lastSeenDate: Date;
  isAIControlled: boolean;
}
