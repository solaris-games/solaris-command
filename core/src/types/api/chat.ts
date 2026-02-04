import { Conversation, Message } from "../chat";

export interface CreateConversationRequest {
  name: string;
  participantIds: string[]; // Player IDs
}

export interface SendMessageRequest {
  content: string;
}

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
