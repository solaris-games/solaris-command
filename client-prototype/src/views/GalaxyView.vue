<template>
  <div class="d-flex flex-column vh-100">
    <HeaderBar @toggle-leaderboard="toggleLeaderboard" />

    <div class="d-flex flex-grow-1 position-relative overflow-hidden">
      <!-- Loading and Error indicators, positioned absolutely over the map area -->
      <div
        v-if="galaxyStore.loading"
        class="position-absolute top-50 start-50 translate-middle text-white z-index-10"
      >
        <div class="spinner-border" role="status">
          <span class="sr-only"> Loading Galaxy...</span>
        </div>
      </div>
      <div
        v-else-if="galaxyStore.error"
        class="position-absolute top-50 start-50 translate-middle text-danger z-index-10"
      >
        {{ galaxyStore.error }}
      </div>
      <!-- Map and Overlay Container -->
      <div class="flex-grow-1 position-relative">
        <div
          class="position-absolute top-0 start-0 w-100 h-100"
          id="stageContainer"
          ref="stageContainer"
        >
          <v-stage
            v-if="configStage.width && configStage.height"
            :config="configStage"
            @wheel="handleWheel"
            @dragend="handleDragEnd"
          >
            <HexMap />
          </v-stage>
        </div>

        <div
          id="mapOverlayContainer"
          class="row position-absolute top-0 start-0 w-100 h-100"
        >
          <!-- Left sidebar -->
          <div id="mapOverlayLeftSidebar" class="col-auto">
            <LeftSidebar
              @toggle-join-game="toggleJoinGame"
              @toggle-leaderboard="toggleLeaderboard"
            />
          </div>

          <!-- Left map -->
          <div id="mapOverlayLeft" class="col-4 col-lg-3 mt-3">
            <SelectionPanel
              v-if="!movementStore.isMoveMode && !combatStore.isAttackMode"
            />
            <MovementPanel v-if="movementStore.isMoveMode" />
            <AttackPanel v-if="combatStore.isAttackMode" />
          </div>

          <!-- Center map -->
          <div id="mapOverlayCenter" class="col mt-3 d-flex justify-content-center">
            <JoinGameModal v-if="showJoinGame" @close="showJoinGame = false" />
            <LeaderboardModal
              v-if="showLeaderboard"
              @close="showLeaderboard = false"
            />
          </div>

          <!-- Right map -->
          <div id="mapOverlayRight" class="col-4 col-lg-3 mt-3">
            <MapOverlayButtons />
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useGalaxyStore } from "../stores/galaxy";
import { useMovementStore } from "../stores/movement";
import { useCombatStore } from "../stores/combat";
import HexMap from "../components/HexMap.vue";
import HeaderBar from "../components/layout/HeaderBar.vue";
import LeftSidebar from "../components/layout/LeftSidebar.vue";
import JoinGameModal from "../components/modals/JoinGameModal.vue";
import LeaderboardModal from "../components/modals/LeaderboardModal.vue";
import RightSidebar from "../components/layout/RightSidebar.vue";
import SelectionPanel from "../components/layout/SelectionPanel.vue";
import MovementPanel from "../components/layout/MovementPanel.vue";
import AttackPanel from "../components/layout/AttackPanel.vue";
import MapOverlayButtons from "../components/layout/MapOverlayButtons.vue";
import { GameStates } from "@solaris-command/core/src/types/game";

const route = useRoute();
const galaxyStore = useGalaxyStore();
const movementStore = useMovementStore();
const combatStore = useCombatStore();
const stageContainer = ref<HTMLDivElement | null>(null);

const showJoinGame = ref(false);
const showLeaderboard = ref(false);

const toggleJoinGame = () => {
  showLeaderboard.value = false;
  showJoinGame.value = !showJoinGame.value;
};

const toggleLeaderboard = () => {
  showJoinGame.value = false;
  showLeaderboard.value = !showLeaderboard.value;
};

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

    resizeObserver = new ResizeObserver((entries) => {
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

  // Auto-open the join game modal if there is no player and the game is pending.
  if (
    galaxyStore.galaxy?.game.state.status === GameStates.PENDING &&
    galaxyStore.currentPlayer == null
  ) {
    showJoinGame.value = true;
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
#mapOverlayContainer {
  pointer-events: none; /* Allow clicks to pass through the overlay */
}

/* Re-enable pointer events for the content inside the columns */
#mapOverlayLeftSidebar > *,
#mapOverlayLeft > *,
#mapOverlayCenter > *,
#mapOverlayRight > * {
  pointer-events: auto;
}

/* z-index-10 for the loading/error message needs to be explicitly defined if not available in bootstrap utilities */
.z-index-10 {
  z-index: 10;
}
</style>
