<template>
  <div class="galaxy-view">
    <NavBar />
    <div class="main-area">
      <div v-if="galaxyStore.loading" class="loading">Loading Galaxy...</div>
      <div v-else-if="galaxyStore.error" class="error">{{ galaxyStore.error }}</div>

      <div class="map-container" ref="container">
        <v-stage :config="configStage" @wheel="handleWheel" @dragend="handleDragEnd">
            <HexMap />
        </v-stage>
      </div>

      <SelectionPanel class="sidebar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useGalaxyStore } from '../stores/galaxy';
import NavBar from '../components/NavBar.vue';
import HexMap from '../components/HexMap.vue';
import SelectionPanel from '../components/SelectionPanel.vue';

const route = useRoute();
const galaxyStore = useGalaxyStore();
const container = ref<HTMLDivElement | null>(null);

const configStage = reactive({
  width: window.innerWidth - 300,
  height: window.innerHeight - 60, // approx navbar height
  draggable: true,
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1
});

onMounted(async () => {
    const gameId = route.params.id as string;
    await galaxyStore.fetchGalaxy(gameId);

    // Center map roughly
    if (galaxyStore.galaxy) {
        configStage.x = (configStage.width / 2);
        configStage.y = (configStage.height / 2);
    }

    window.addEventListener('resize', handleResize);
});

function handleResize() {
    configStage.width = window.innerWidth - 300;
    configStage.height = window.innerHeight - 60;
}

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

  configStage.x = -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale;
  configStage.y = -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale;
}

function handleDragEnd(e: any) {
    // Update reactive state if needed
    configStage.x = e.target.x();
    configStage.y = e.target.y();
}
</script>

<style scoped>
.galaxy-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-area {
  flex-grow: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}
.map-container {
  flex-grow: 1;
  background: #000;
  overflow: hidden;
}
.sidebar {
    width: 300px;
    background: #222;
    z-index: 10;
}
.loading, .error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    z-index: 20;
}
.error { color: red; }
</style>
