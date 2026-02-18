import { defineStore } from "pinia";
import axios from "axios";
import { Conversation, Message } from "@solaris-command/core/src/types/chat";
import { UnifiedId } from "@solaris-command/core/src/types/unified-id";
import {
  ConversationResponse,
  GetUnreadConversationCountResponse,
} from "@solaris-command/core/src/types/api/chat";
import { useGalaxyStore } from "./galaxy";

export const useChatStore = defineStore("chat", {
  state: () => ({
    conversations: [] as ConversationResponse[],
    messages: {} as Record<string, Message[]>,
    activeConversationId: null as string | null,
    unreadCount: 0,
    isOpen: false,
  }),
  getters: {
    activeConversation: (state) =>
      state.conversations.find(
        (c) => String(c._id) === state.activeConversationId,
      ) || null,
    currentMessages: (state) =>
      state.activeConversationId
        ? state.messages[state.activeConversationId] || []
        : [],
  },
  actions: {
    toggleChat() {
      this.activeConversationId = null;
      this.isOpen = !this.isOpen;
    },
    async fetchConversations(gameId: UnifiedId) {
      try {
        const res = await axios.get<ConversationResponse[]>(
          `/api/v1/games/${gameId}/conversations`,
        );

        this.conversations = res.data;

        this.updateUnreadCountFromConversations();
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      }
    },
    async fetchUnreadCount(gameId: UnifiedId) {
      try {
        const res = await axios.get<GetUnreadConversationCountResponse>(
          `/api/v1/games/${gameId}/conversations/unread-count`,
        );

        this.unreadCount = res.data.unreadCount;
      } catch (err) {
        console.error("Failed to fetch unread count", err);
      }
    },
    async createConversation(
      gameId: UnifiedId,
      name: string | undefined,
      participantPlayerIds: string[],
    ) {
      try {
        const res = await axios.post(`/api/v1/games/${gameId}/conversations`, {
          name,
          participantPlayerIds,
        });
        const conv = res.data.conversation;

        const existing = this.conversations.find(
          (c) => String(c._id) === String(conv._id),
        );
        if (!existing) {
          this.conversations.unshift(conv);
        }
        return conv;
      } catch (err) {
        console.error("Failed to create conversation", err);
        throw err;
      }
    },
    async fetchMessages(gameId: UnifiedId, conversationId: UnifiedId) {
      try {
        const res = await axios.get(
          `/api/v1/games/${gameId}/conversations/${conversationId}/messages`,
        );
        this.messages[String(conversationId)] = res.data.messages;

        // Mark as read locally
        const conv = this.conversations.find(
          (c) => String(c._id) === String(conversationId),
        );

        if (conv && conv.hasUnread) {
          conv.hasUnread = false;
          this.updateUnreadCountFromConversations();
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    },
    async sendMessage(
      gameId: UnifiedId,
      conversationId: UnifiedId,
      content: string,
    ) {
      try {
        const res = await axios.post(
          `/api/v1/games/${gameId}/conversations/${conversationId}/messages`,
          {
            content,
          },
        );
        this.handleMessage(res.data.message);
      } catch (err) {
        console.error("Failed to send message", err);
        throw err;
      }
    },
    handleMessage(message: Message) {
      const conversationId = String(message.conversationId);
      
      if (!this.messages[conversationId]) {
        this.messages[conversationId] = [];
      }

      const exists = this.messages[conversationId].some(
        (m) => String(m._id) === String(message._id),
      );

      if (!exists) {
        this.messages[conversationId].push(message);
      }

      const conv = this.conversations.find(
        (c) => String(c._id) === conversationId,
      );

      if (conv) {
        conv.updatedAt = message.sentAt;

        // If not active, mark as unread
        if (this.activeConversationId !== conversationId) {
          if (!conv.hasUnread) {
            conv.hasUnread = true;
            this.updateUnreadCountFromConversations();
          }
        }

        this.conversations.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      } else {
        // If it's a new conversation, fetch the whole list again.
        // We can get the gameId from the Galaxy store.
        const galaxyStore = useGalaxyStore();

        if (galaxyStore.galaxy) {
          this.fetchConversations(galaxyStore.galaxy.game._id);
        }
      }
    },
    selectConversation(conversationId: string) {
      this.activeConversationId = conversationId;
    },
    updateUnreadCountFromConversations() {
      this.unreadCount = this.conversations.filter((c) => c.hasUnread).length;
    },
  },
});
