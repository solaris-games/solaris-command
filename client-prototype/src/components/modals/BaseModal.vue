<template>
  <div
    class="modal fade"
    tabindex="-1"
    role="dialog"
    :class="{ 'show d-block': show }"
    @click.self="close"
  >
    <div class="modal-dialog" :class="size" role="document">
      <div class="modal-content bg-dark text-white">
        <div class="modal-header">
          <h5 class="modal-title" v-if="title">{{ title }}</h5>
          <slot name="header-actions"></slot>
          <button
            type="button"
            class="btn-close btn-sm btn-outline-theme"
            @click="close"
            data-bs-toggle="tooltip"
            title="Close this dialog"
          ></button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "", // e.g. 'modal-lg', 'modal-xl', 'modal-sm'
  },
});

const emit = defineEmits(["close"]);

const close = () => {
  emit("close");
};
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
  padding-top: 50px;
  z-index: 20;
}
</style>
