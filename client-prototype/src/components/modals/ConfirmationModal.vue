<template>
  <BaseModal :show="show" :title="title" @close="onCancel">
    <template #default>
      <slot></slot>
    </template>
    <template #footer>
      <button
        type="button"
        class="btn btn-outline-danger"
        @click="onCancel"
        data-bs-toggle="tooltip"
        title="Cancel this action"
      >
        <i class="fas fa-ban"></i> Cancel
      </button>
      <button
        type="button"
        class="btn btn-success"
        @click="onConfirm"
        data-bs-toggle="tooltip"
        title="Confirm this action"
      >
        <i class="fas fa-check"></i> Confirm
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "./BaseModal.vue";

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["confirm", "cancel"]);

const onConfirm = () => {
  emit("confirm");
};

const onCancel = () => {
  emit("cancel");
};
</script>
