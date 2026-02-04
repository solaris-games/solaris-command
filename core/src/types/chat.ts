import { UnifiedId } from "./unified-id";

export interface Conversation {
  _id: UnifiedId;
  gameId: UnifiedId;
  name: string;
  participantIds: UnifiedId[]; // Player IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: UnifiedId;
  conversationId: UnifiedId;
  senderPlayerId: UnifiedId; // Player ID
  content: string;
  sentAt: Date;
  tick: number;
  cycle: number;
}
