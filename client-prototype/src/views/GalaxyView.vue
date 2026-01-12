<template>
  <div class="d-flex flex-column vh-100">
    <HeaderBar />

    <div class="d-flex flex-grow-1 position-relative overflow-hidden">
      <!-- Loading and Error indicators, positioned absolutely over the map area -->
      <div
        v-if="galaxyStore.loading"
        class="position-absolute top-50 start-50 translate-middle text-white z-index-10"
      >
        Loading Galaxy...
      </div>
      <div
        v-else-if="galaxyStore.error"
        class="position-absolute top-50 start-50 translate-middle text-danger z-index-10"
      >
        {{ galaxyStore.error }}
      </div>
      <div class="flex-grow-1 overflow-hidden" ref="stageContainer">
        <v-stage
          v-if="configStage.width && configStage.height"
          :config="configStage"
          @wheel="handleWheel"
          @dragend="handleDragEnd"
        >
          <HexMap />
        </v-stage>
      </div>

      <RightSidebar />
      <SelectionPanel />
      <MapOverlayButtons />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useGalaxyStore } from "../stores/galaxy";
import HexMap from "../components/HexMap.vue";
import HeaderBar from "../components/layout/HeaderBar.vue";
import RightSidebar from "../components/layout/RightSidebar.vue";
import SelectionPanel from "../components/layout/SelectionPanel.vue";
import MapOverlayButtons from "../components/layout/MapOverlayButtons.vue";

const route = useRoute();
const galaxyStore = useGalaxyStore();
const stageContainer = ref<HTMLDivElement | null>(null);

const configStage = reactive({
  width: 0,
  height: 0,
  draggable: true,
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
});

let resizeObserver: ResizeObserver;

onMounted(async () => {
  const gameId = route.params.id as string;
  
  if (stageContainer.value) {
    configStage.width = stageContainer.value.offsetWidth;
    configStage.height = stageContainer.value.offsetHeight;

    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        configStage.width = entry.contentRect.width;
        configStage.height = entry.contentRect.height;
      }
    });

    resizeObserver.observe(stageContainer.value);
  }

  await galaxyStore.fetchGalaxy(gameId as any);

  // Center map roughly
  if (galaxyStore.galaxy) {
    configStage.x = configStage.width / 2;
    configStage.y = configStage.height / 2;
  }
});

onUnmounted(() => {
  if (resizeObserver && stageContainer.value) {
    resizeObserver.unobserve(stageContainer.value);
  }
});

function handleWheel(e: any) {
  e.evt.preventDefault();
  const scaleBy = 1.1;
  const stage = e.target.getStage();
  const oldScale = stage.scaleX();
  const mousePointTo = {
    x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
    y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
  };

  const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

  configStage.scaleX = newScale;
  configStage.scaleY = newScale;

  configStage.x =
    -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale;
  configStage.y =
    -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale;
}

function handleDragEnd(e: any) {
  // Update reactive state if needed
  configStage.x = e.target.x();
  configStage.y = e.target.y();
}
</script>

<style scoped>
/* Removed .sidebar, .loading-indicator, .error-indicator styles as they are now handled by Bootstrap classes or moved to new components */
/* z-index-10 for the loading/error message needs to be explicitly defined if not available in bootstrap utilities */
.z-index-10 {
  z-index: 10;
}
</style>
