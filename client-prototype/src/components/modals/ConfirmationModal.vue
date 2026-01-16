<template>
  <div class="modal fade" tabindex="-1" role="dialog" :class="{ 'show d-block': show }">
    <div class="modal-dialog" role="document">
      <div class="modal-content bg-dark text-white">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button type="button" class="btn-close" @click="onCancel" data-bs-toggle="tooltip" title="Close this dialog"></button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-danger" @click="onCancel" data-bs-toggle="tooltip" title="Cancel this action">Cancel</button>
          <button type="button" class="btn btn-success" @click="onConfirm" data-bs-toggle="tooltip" title="Confirm this action">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const emit = defineEmits(['confirm', 'cancel']);

const onConfirm = () => {
  emit('confirm');
};

const onCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal {
  padding-top: 50px;
  z-index: 20;
}
</style>
