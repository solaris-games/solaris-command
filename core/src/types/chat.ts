import { UnifiedId } from "./unified-id";

export interface Conversation {
  _id: UnifiedId;
  gameId: UnifiedId;
  name: string;
  participantPlayerIds: UnifiedId[];
  unreadPlayerIds: UnifiedId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: UnifiedId;
  conversationId: UnifiedId;
  playerId: UnifiedId;
  content: string;
  sentAt: Date;
  tick: number;
  cycle: number;
}
