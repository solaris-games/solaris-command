import { Schema, model } from "mongoose";
import { Conversation, Message } from "@solaris-command/core/src/types/chat";

const ConversationSchema = new Schema<Conversation>(
  {
    gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    name: { type: String, required: false },
    participantPlayerIds: [
      { type: Schema.Types.ObjectId, ref: "Player", required: true },
    ],
  },
  { timestamps: true },
);

ConversationSchema.index({ gameId: 1, participantPlayerIds: 1 });

export const ConversationModel = model<Conversation>(
  "Conversation",
  ConversationSchema,
);

const MessageSchema = new Schema<Message>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  playerId: {
    type: Schema.Types.ObjectId,
    ref: "Player",
    required: true,
  },
  content: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  tick: { type: Number, required: true },
  cycle: { type: Number, required: true },
});

MessageSchema.index({ conversationId: 1, sentAt: 1 });

export const MessageModel = model<Message>("Message", MessageSchema);
