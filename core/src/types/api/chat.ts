import { Conversation, Message } from "../chat";

// TODO: Use explicit prop names and types.
// TODO: Add to mapping layer.

export interface CreateConversationResponse {
  conversation: Conversation;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
}

export interface GetMessagesResponse {
  messages: Message[];
}

export interface SendMessageResponse {
  message: Message;
}
