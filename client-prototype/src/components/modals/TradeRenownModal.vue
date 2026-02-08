<template>
  <BaseModal :show="show" title="Send Renown" @close="closeModal">
    <div class="mb-3">
      <p class="text-muted">
        Send renown to show appreciation to another player.
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
        <label for="renownAmount" class="form-label">Amount</label>
        <div class="input-group">
          <input
            type="number"
            class="form-control"
            id="renownAmount"
            v-model.number="renownAmount"
            min="1"
            :max="galaxyStore.currentPlayer?.renownToDistribute ?? 0"
            :disabled="isLoading"
          />
          <span class="input-group-text"
            >/ {{ galaxyStore.currentPlayer?.renownToDistribute ?? 0 }}</span
          >
        </div>
        <div class="form-text">
          Available Renown:
          {{ galaxyStore.currentPlayer?.renownToDistribute ?? 0 }}
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
        class="btn btn-primary"
        @click="confirmSend"
        :disabled="isLoading || !isValid"
      >
        <span
          v-if="isLoading"
          class="spinner-border spinner-border-sm me-1"
          role="status"
          aria-hidden="true"
        ></span>
        <i class="fas fa-heart me-1"></i>Send Renown
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
const renownAmount = ref(0);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isValid = computed(() => {
  return (
    targetPlayerId.value !== "" &&
    renownAmount.value > 0 &&
    renownAmount.value <= (galaxyStore.currentPlayer?.renownToDistribute ?? 0)
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
  renownAmount.value = 0;
  error.value = null;
  emit("close");
};

const confirmSend = async () => {
  if (!isValid.value || !galaxyStore.currentPlayer) return;

  isLoading.value = true;
  error.value = null;

  try {
    await axios.post(`/api/v1/games/${galaxyStore.galaxy!.game._id}/players/renown`, {
      targetPlayerId: targetPlayerId.value,
      renown: renownAmount.value,
    });
    galaxyStore.currentPlayer!.renownToDistribute -= renownAmount.value;
    emit("success");
    closeModal();
  } catch (err: any) {
    console.error("Failed to send renown:", err);
    error.value =
      err.response?.data?.message || "Failed to send renown. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>
