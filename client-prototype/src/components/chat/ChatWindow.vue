<template>
  <div class="card p-1 h-100 d-flex flex-column">
    <div
      class="card-header bg-dark d-flex justify-content-between align-items-center"
    >
      <div class="fw-bold text-truncate">
        <button class="btn btn-sm btn-outline-secondary me-2" @click="goBack">
          <i class="fas fa-arrow-left"></i></button
        >{{ conversationName }}
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline-theme btn-close"
        data-bs-toggle="tooltip"
        title="Close this panel"
        @click="handleClose"
      ></button>
    </div>

    <div
      class="card-body bg-dark bg-opacity-95 flex-grow-1 overflow-auto p-2"
      style="height: 10vh"
      ref="messagesContainer"
    >
      <div class="d-flex flex-column">
        <div
          v-for="(msg, index) in messages"
          :key="String(msg._id)"
          class="mb-2 d-flex flex-column"
          :class="isMe(msg.senderPlayerId) ? 'align-items-end' : 'align-items-start'"
        >
          <div
            v-if="shouldShowName(index, msg)"
            class="text-muted small mb-1 px-1"
          >
            {{ getPlayerAlias(msg.senderPlayerId) }}
          </div>

          <div
            class="p-2 rounded text-break"
            style="max-width: 85%; white-space: pre-wrap;"
            :style="getMessageStyle(msg.senderPlayerId)"
          >
            {{ msg.content }}
          </div>

          <div class="text-muted small mt-0 px-1" style="font-size: 0.7em">
            {{ formatTime(msg.sentAt) }} (T:{{ msg.tick }})
          </div>
        </div>
      </div>
    </div>

    <div class="card-footer bg-dark">
      <div class="input-group">
        <textarea
          class="form-control"
          placeholder="Write your message..."
          v-model="newMessage"
          rows="1"
          style="resize: none"
          @keydown.enter="handleEnter"
        ></textarea>
        <button
          class="btn btn-outline-default"
          type="button"
          @click="sendMessage"
        >
          <i class="fa fa-paper-plane text-muted"></i>
        </button>
      </div>
    </div>

    <div class="card-arrow">
      <div class="card-arrow-top-left"></div>
      <div class="card-arrow-top-right"></div>
      <div class="card-arrow-bottom-left"></div>
      <div class="card-arrow-bottom-right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useChatStore } from "../../stores/chat";
import { useGalaxyStore } from "../../stores/galaxy";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";

const chatStore = useChatStore();
const galaxyStore = useGalaxyStore();

const newMessage = ref("");
const messagesContainer = ref<HTMLDivElement | null>(null);

const messages = computed(() => chatStore.currentMessages);
const activeConversation = computed(() => chatStore.activeConversation);

const conversationName = computed(() => {
  const conv = activeConversation.value;
  if (!conv) return "Chat";
  if (conv.name) return conv.name;

  return (
    conv.participantIds
      .filter((pid) => String(pid) !== String(galaxyStore.currentPlayerId))
      .map(
        (pid) => galaxyStore.playerLookup?.get(String(pid))?.alias || "Unknown",
      )
      .join(", ") || "Just You"
  );
});

function goBack() {
  chatStore.activeConversationId = null;
}

function isMe(senderPlayerId: any) {
  return String(senderPlayerId) === String(galaxyStore.currentPlayerId);
}

function getPlayerAlias(playerId: any) {
  return galaxyStore.playerLookup?.get(String(playerId))?.alias || "Unknown";
}

function shouldShowName(index: number, msg: any) {
  if (isMe(msg.senderPlayerId)) return false;
  if (index === 0) return true;
  const prevMsg = messages.value[index - 1];
  return String(prevMsg.senderPlayerId) !== String(msg.senderPlayerId);
}

function getMessageStyle(senderPlayerId: any) {
  const player = galaxyStore.playerLookup?.get(String(senderPlayerId));
  if (!player) return { background: "#eee", color: "#000" };

  const color = PLAYER_COLOR_LOOKUP.get(player.color);
  if (!color) return { background: "#eee", color: "#000" };

  return {
    backgroundColor: color.background,
    color: color.foreground,
    border: "1px solid rgba(255,255,255,0.1)",
  };
}

function formatTime(dateStr: Date | string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function sendMessage() {
  if (!newMessage.value.trim() || !galaxyStore.galaxy) return;

  const content = newMessage.value;
  newMessage.value = ""; // optimistic clear

  await chatStore.sendMessage(
    galaxyStore.galaxy.game._id,
    activeConversation.value!._id,
    content,
  );
  scrollToBottom();
}

function handleEnter(e: KeyboardEvent) {
  if (!e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

onMounted(() => {
  if (galaxyStore.galaxy && activeConversation.value) {
    chatStore.fetchMessages(
      galaxyStore.galaxy.game._id,
      activeConversation.value._id,
    );
  }
  scrollToBottom();
});

watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  },
);

const handleClose = () => {
  chatStore.isOpen = false;
};
</script>
