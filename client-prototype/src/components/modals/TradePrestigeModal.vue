<template>
  <BaseModal
    :show="show"
    title="Trade Prestige"
    @close="closeModal"
  >
    <div class="mb-3">
      <p class="text-muted">
        Send prestige to another player to aid an ally or for political reasons.
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
            v-for="player in players"
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
            :max="maxPrestige"
            :disabled="isLoading"
          />
          <span class="input-group-text">/ {{ maxPrestige }}</span>
        </div>
        <div class="form-text">
          Available Prestige: {{ maxPrestige }}
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        @click="closeModal"
        :disabled="isLoading"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        @click="confirmTrade"
        :disabled="isLoading || !isValid"
      >
        <span
          v-if="isLoading"
          class="spinner-border spinner-border-sm me-1"
          role="status"
          aria-hidden="true"
        ></span>
        Send Prestige
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import axios from "axios";
import BaseModal from "./BaseModal.vue";
import type { Player } from "@solaris-command/core/src/types/player";

const props = defineProps<{
  show: boolean;
  players: Player[];
  maxPrestige: number;
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
    prestigeAmount.value <= props.maxPrestige
  );
});

const closeModal = () => {
  targetPlayerId.value = "";
  prestigeAmount.value = 0;
  error.value = null;
  emit("close");
};

const confirmTrade = async () => {
  if (!isValid.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    await axios.post("/api/v1/players/trade", {
      targetPlayerId: targetPlayerId.value,
      prestige: prestigeAmount.value,
    });
    emit("success");
    closeModal();
  } catch (err: any) {
    console.error("Failed to trade prestige:", err);
    error.value =
      err.response?.data?.message || "Failed to process trade. Please try again.";
  } finally {
    isLoading.value = false;
  }
};
</script>
