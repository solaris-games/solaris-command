import { defineStore } from "pinia";
import axios from "axios";
import { Conversation, Message } from "@solaris-command/core/src/types/chat";
import { UnifiedId } from "@solaris-command/core/src/types/unified-id";

export const useChatStore = defineStore("chat", {
  state: () => ({
    conversations: [] as Conversation[],
    messages: {} as Record<string, Message[]>,
    activeConversationId: null as string | null,
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
      this.isOpen = !this.isOpen;
    },
    async fetchConversations(gameId: UnifiedId) {
      try {
        const res = await axios.get(`/api/v1/games/${gameId}/conversations`);
        this.conversations = res.data.conversations;
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      }
    },
    async createConversation(
      gameId: UnifiedId,
      name: string | undefined,
      participantIds: string[],
    ) {
      try {
        const res = await axios.post(`/api/v1/games/${gameId}/conversations`, {
          name,
          participantIds,
        });
        const conv = res.data.conversation;

        const existing = this.conversations.find(
          (c) => String(c._id) === String(conv._id),
        );
        if (!existing) {
          this.conversations.unshift(conv);
        } else {
          // If it exists, maybe just update it or move to top?
          // It will be handled by fetch/sort usually, but good to ensure logic.
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
        this.conversations.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      }
    },
    selectConversation(conversationId: string) {
      this.activeConversationId = conversationId;
    },
  },
});
