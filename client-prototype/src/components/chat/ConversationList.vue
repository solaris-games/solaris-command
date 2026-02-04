<template>
  <div class="card p-1 h-100">
    <div
      class="card-header bg-dark d-flex justify-content-between align-items-center"
    >
      <div class="fw-bold text-truncate">
        <button
          class="btn btn-sm btn-outline-secondary me-2"
          @click="showCreate = true"
        >
          <i class="fas fa-plus"></i></button
        >Conversations
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline-theme btn-close"
        data-bs-toggle="tooltip"
        title="Close this panel"
        @click="handleClose"
      ></button>
    </div>

    <!-- Create Mode -->

    <div v-if="showCreate" class="card-body bg-dark bg-opacity-90 p-2">
      <h6 class="mb-3">New Conversation</h6>
      <div class="mb-3">
        <label class="form-label">Participants</label>
        <div class="list-group" style="max-height: 200px; overflow-y: auto">
          <button
            v-for="player in potentialParticipants"
            :key="String(player._id)"
            class="list-group-item list-group-item-action d-flex align-items-center"
            :class="{
              active: selectedParticipantIds.includes(String(player._id)),
            }"
            @click="toggleParticipant(String(player._id))"
          >
            <div
              class="rounded-circle me-2"
              :style="{
                width: '12px',
                height: '12px',
                backgroundColor: getPlayerColor(player).background,
              }"
            ></div>
            {{ player.alias }}
          </button>
        </div>
      </div>
      <div class="mb-3">
        <input
          v-model="newConversationName"
          class="form-control form-control-sm"
          placeholder="Name (Optional)"
        />
      </div>
      <div class="d-flex justify-content-between">
        <button class="btn btn-sm btn-outline-secondary" @click="cancelCreate">
          Cancel
        </button>
        <button
          class="btn btn-sm btn-theme"
          @click="createConversation"
          :disabled="selectedParticipantIds.length === 0"
        >
          Create
        </button>
      </div>
    </div>

    <!-- List Mode -->
    <div v-else class="card-body bg-dark bg-opacity-90 p-2 overflow-auto">
      <div
        v-if="chatStore.conversations.length === 0"
        class="p-3 text-muted text-center"
      >
        No conversations yet.
      </div>
      <div class="list-group">
        <button
          v-for="conv in chatStore.conversations"
          :key="String(conv._id)"
          class="list-group-item list-group-item-action"
          @click="selectConversation(String(conv._id))"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div class="fw-bold text-truncate">
              {{ getConversationName(conv) }}
            </div>
            <small class="text-muted" style="font-size: 0.7em">{{
              formatTime(conv.updatedAt)
            }}</small>
          </div>

          <small class="text-muted d-block text-truncate">
            {{ getParticipantNames(conv) }}
          </small>
        </button>
      </div>
    </div>

    <!-- Card Arrow for styling consistency if used elsewhere -->
    <div class="card-arrow">
      <div class="card-arrow-top-left"></div>
      <div class="card-arrow-top-right"></div>
      <div class="card-arrow-bottom-left"></div>
      <div class="card-arrow-bottom-right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useChatStore } from "../../stores/chat";
import { useGalaxyStore } from "../../stores/galaxy";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import { Conversation } from "@solaris-command/core/src/types/chat";

const chatStore = useChatStore();
const galaxyStore = useGalaxyStore();

const showCreate = ref(false);
const selectedParticipantIds = ref<string[]>([]);
const newConversationName = ref("");

const potentialParticipants = computed(() => {
  return galaxyStore.players.filter(
    (p) => String(p._id) !== String(galaxyStore.currentPlayerId),
  );
});

function getPlayerColor(player: any) {
  return (
    PLAYER_COLOR_LOOKUP.get(player.color) || {
      background: "#ccc",
      foreground: "#000",
    }
  );
}

function toggleParticipant(id: string) {
  if (selectedParticipantIds.value.includes(id)) {
    selectedParticipantIds.value = selectedParticipantIds.value.filter(
      (pid) => pid !== id,
    );
  } else {
    selectedParticipantIds.value.push(id);
  }
}

function cancelCreate() {
  showCreate.value = false;
  selectedParticipantIds.value = [];
  newConversationName.value = "";
}

async function createConversation() {
  if (selectedParticipantIds.value.length === 0) return;
  try {
    const conv = await chatStore.createConversation(
      galaxyStore.galaxy!.game._id,
      newConversationName.value || undefined,
      selectedParticipantIds.value,
    );
    cancelCreate();
    chatStore.selectConversation(String(conv._id));
  } catch (e) {
    alert("Failed to create conversation");
  }
}

function selectConversation(id: string) {
  chatStore.selectConversation(id);
}

function getConversationName(conv: Conversation) {
  if (conv.name) return conv.name;
  // Generate name from participants
  return getParticipantNames(conv);
}

function getParticipantNames(conv: Conversation) {
  const names = conv.participantIds
    .filter((pid) => String(pid) !== String(galaxyStore.currentPlayerId))
    .map(
      (pid) => galaxyStore.playerLookup?.get(String(pid))?.alias || "Unknown",
    )
    .join(", ");

  return names || "Just You";
}

function formatTime(dateStr: Date | string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const handleClose = () => {
    chatStore.isOpen = false
}
</script>

<style scoped>
/* Scoped styles if needed */
</style>
