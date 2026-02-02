<template>
  <a type="button" @click="handleClick"
    ><span :class="textClass"
      ><u>({{ coords.q }}, {{ coords.r }})</u></span
    ></a
  >
</template>

<script setup lang="ts">
import { useMapSettingsStore } from "../stores/mapSettings";

const props = defineProps({
  coords: {
    type: Object,
    required: true,
  },
  textClass: {
    type: String,
    default: "text-info",
  }
});

const mapSettingsStore = useMapSettingsStore();

const handleClick = () => {
  mapSettingsStore.centerOnHex(props.coords.q, props.coords.r);
};
</script>
