<template>
  <BaseModal :show="show" title="Send Prestige" @close="closeModal">
    <div class="mb-3">
      <p class="text-muted">
        Send prestige to another player.
      </p>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div class="mb-3">
        <label for="targetPlayer" class="form-label">Recipient</label>
        <select
          id="targetPlayer"
          class="form-select"
          v-model="targetPlayerId"
          :disabled="isLoading"
        >
          <option value="" disabled>Select a player...</option>
          <option
            v-for="player in eligiblePlayers"
            :key="player._id.toString()"
            :value="player._id.toString()"
          >
            {{ player.alias }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label for="prestigeAmount" class="form-label">Amount</label>
        <div class="input-group">
          <input
            type="number"
            class="form-control"
            id="prestigeAmount"
            v-model.number="prestigeAmount"
            min="1"
            :max="galaxyStore.currentPlayer?.prestigePoints ?? 0"
            :disabled="isLoading"
          />
          <span class="input-group-text"
            >/ {{ galaxyStore.currentPlayer?.prestigePoints ?? 0 }}</span
          >
        </div>
        <div class="form-text">
          Available Prestige:
          {{ galaxyStore.currentPlayer?.prestigePoints ?? 0 }}
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn-outline-danger"
        @click="closeModal"
        :disabled="isLoading"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-success"
        @click="confirmTrade"
        :disabled="isLoading || !isValid"
      >
        <span
          v-if="isLoading"
          class="spinner-border spinner-border-sm me-1"
          role="status"
          aria-hidden="true"
        ></span>
        <i class="fas fa-coins me-1"></i>Send Prestige
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import BaseModal from "./BaseModal.vue";
import { useGalaxyStore } from "../../stores/galaxy";

const galaxyStore = useGalaxyStore();

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "success"): void;
}>();

const targetPlayerId = ref("");
const prestigeAmount = ref(0);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isValid = computed(() => {
  return (
    targetPlayerId.value !== "" &&
    prestigeAmount.value > 0 &&
    prestigeAmount.value <= (galaxyStore.currentPlayer?.prestigePoints ?? 0)
  );
});

const eligiblePlayers = computed(() => {
  if (!galaxyStore.galaxy || !galaxyStore.currentPlayer) return [];
  return galaxyStore.galaxy.players.filter(
    (p) => p._id.toString() !== galaxyStore.currentPlayer?._id.toString(),
  );
});

const closeModal = () => {
  targetPlayerId.value = "";
  prestigeAmount.value = 0;
  error.value = null;
  emit("close");
};

const confirmTrade = async () => {
  if (!isValid.value || !galaxyStore.currentPlayer) return;

  isLoading.value = true;
  error.value = null;

  try {
    await axios.post(`/api/v1/games/${galaxyStore.galaxy!.game._id}/players/trade`, {
      targetPlayerId: targetPlayerId.value,
      prestige: prestigeAmount.value,
    });
    galaxyStore.currentPlayer.prestigePoints -= prestigeAmount.value;
    emit("success");
    closeModal();
  } catch (err: any) {
    console.error("Failed to trade prestige:", err);
    error.value =
      err.response?.data?.message ||
      "Failed to process trade. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>
