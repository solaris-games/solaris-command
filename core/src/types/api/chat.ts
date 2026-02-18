import { Conversation, Message } from "../chat";

export interface ConversationResponse extends Conversation {
  hasUnread: boolean;
}

export interface CreateConversationResponse {
  conversation: Conversation;
}

export interface GetConversationsResponse {
  conversations: ConversationResponse[];
}

export interface GetMessagesResponse {
  messages: Message[];
}

export interface SendMessageResponse {
  message: Message;
}

export interface GetUnreadConversationCountResponse {
  unreadCount: number;
}
