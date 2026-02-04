import { Types } from "mongoose";
import { ConversationFactory, MessageFactory } from "@solaris-command/core/src/factories/chat-factory";
import { ConversationModel, MessageModel } from "../db/schemas/chat";
import { PlayerModel } from "../db/schemas/player";
import { UnifiedId } from "@solaris-command/core/src/types/unified-id";
import { GameService } from "./GameService";
import { SocketService } from "./SocketService";

export class ChatService {
  static async getConversations(gameId: UnifiedId, playerId: UnifiedId) {
    return ConversationModel.find({
      gameId,
      participantIds: playerId,
    }).sort({ updatedAt: -1 });
  }

  static async findConversation(gameId: UnifiedId, participantIds: UnifiedId[]) {
    const sortedIds = [...participantIds].map(id => String(id)).sort().map(id => new Types.ObjectId(id));
    return ConversationModel.findOne({
      gameId,
      participantIds: sortedIds,
    });
  }

  static async createConversation(gameId: UnifiedId, name: string, participantIds: UnifiedId[]) {
    const sortedIds = [...participantIds].map(id => String(id)).sort().map(id => new Types.ObjectId(id));

    const existing = await ConversationModel.findOne({
      gameId,
      participantIds: sortedIds
    });

    if (existing) {
        return existing;
    }

    const conversation = ConversationFactory.create(gameId, name, sortedIds);
    const model = new ConversationModel(conversation);
    await model.save();
    return model;
  }

  static async getConversationById(conversationId: UnifiedId) {
    return ConversationModel.findById(conversationId);
  }

  static async getMessages(conversationId: UnifiedId, requestingPlayerId: UnifiedId) {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const isParticipant = conversation.participantIds.some(id => String(id) === String(requestingPlayerId));
    if (!isParticipant) {
      throw new Error("Player is not a participant in this conversation");
    }

    return MessageModel.find({ conversationId }).sort({ sentAt: 1 });
  }

  static async sendMessage(gameId: UnifiedId, conversationId: UnifiedId, senderPlayerId: UnifiedId, content: string) {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
        throw new Error("Conversation not found");
    }

    const isParticipant = conversation.participantIds.some(id => String(id) === String(senderPlayerId));
    if (!isParticipant) {
        throw new Error("Sender is not a participant in this conversation");
    }

    const game = await GameService.getById(gameId);
    if (!game) {
        throw new Error("Game not found");
    }

    const tick = game.state.tick;
    const cycle = game.state.cycle;

    const message = MessageFactory.create(conversationId, senderPlayerId, content, tick, cycle);
    const model = new MessageModel(message);
    await model.save();

    conversation.updatedAt = new Date();
    await conversation.save();

    // Emit Socket Event
    const participants = await PlayerModel.find({
        _id: { $in: conversation.participantIds }
    });

    const userIds = participants
        .map(p => p.userId)
        .filter(uid => uid != null);

    for (const userId of userIds) {
        SocketService.publishToUser(userId, "CHAT_MESSAGE", {
            conversationId,
            message
        });
    }

    return model;
  }
}
