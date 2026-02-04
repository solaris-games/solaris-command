import { Conversation, Message } from "../types/chat";
import { UnifiedId } from "../types/unified-id";
import { Types } from "mongoose";

export class ConversationFactory {
  static create(
    gameId: UnifiedId,
    name: string,
    participantIds: UnifiedId[]
  ): Conversation {
    return {
      _id: new Types.ObjectId(),
      gameId,
      name,
      participantIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class MessageFactory {
  static create(
    conversationId: UnifiedId,
    senderId: UnifiedId,
    content: string,
    tick: number,
    cycle: number
  ): Message {
    return {
      _id: new Types.ObjectId(),
      conversationId,
      senderId,
      content,
      sentAt: new Date(),
      tick,
      cycle,
    };
  }
}
