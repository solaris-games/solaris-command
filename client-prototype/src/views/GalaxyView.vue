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
          class="position-absolute top-0 start-0 end-0 bottom-0"
          id="stageContainer"
          ref="stageContainer"
        >
          <v-stage
            v-if="stageConfig.width && stageConfig.height"
            :config="stageConfig"
            @wheel="handleWheel"
            @dragend="handleDragEnd"
          >
            <HexMap />
          </v-stage>
        </div>

        <div
          id="mapOverlayContainer"
          class="row position-absolute top-0 start-0 end-0 bottom-0"
        >
          <!-- Left sidebar -->
          <div id="mapOverlayLeftSidebar" class="col-auto d-none d-md-block">
            <LeftSidebar
              @toggle-join-game="toggleJoinGame"
              @toggle-leaderboard="toggleLeaderboard"
              @toggle-reference-modal="toggleReferenceModal"
              @toggle-event-log-modal="toggleEventLogModal"
            />
          </div>

          <!-- Left map -->
          <div
            id="mapOverlayLeft"
            class="col-12 col-md-4 col-lg-3 mt-2 ps-3 pe-3 ps-md-0 pe-md-0"
          >
            <SelectionPanel
              v-if="!movementStore.isMoveMode && !combatStore.isAttackMode"
            />
            <MovementPanel v-if="movementStore.isMoveMode" />
            <AttackPanel v-if="combatStore.isAttackMode" />
          </div>

          <!-- Center map -->
          <div
            id="mapOverlayCenter"
            class="col mt-2 d-flex justify-content-center"
          ></div>

          <!-- Right map -->
          <div
            id="mapOverlayRight"
            :class="[
              'mt-2',
              mobileFleetOpen ? 'col-12' : 'col-12 col-md-4 col-lg-3',
            ]"
          >
            <div class="d-none d-md-block pe-2">
              <MapOverlayButtons />
            </div>
            <RightSidebar :mobileFleetOpen="mobileFleetOpen" />
          </div>
        </div>

        <!-- Mobile Map Buttons Popup -->
        <div
          v-if="mobileLayersOpen"
          class="position-fixed start-0 d-md-none"
          style="bottom: 52px; right: 12px; z-index: 1050"
        >
          <MapOverlayButtons />
        </div>

        <div
          id="mapOverlayAllContainer"
          class="row position-absolute top-0 start-0 end-0 bottom-0"
        >
          <!-- Center -->
          <div
            id="mapOverlayAll"
            class="col mt-2 d-flex justify-content-center"
          >
            <JoinGameModal v-if="showJoinGame" @close="showJoinGame = false" />
            <LeaderboardModal
              v-if="showLeaderboard"
              @close="showLeaderboard = false"
            />
            <ReferenceModal
              v-if="showReferenceModal"
              @close="showReferenceModal = false"
            />
            <EventLogModal
              v-if="showEventLogModal"
              @close="showEventLogModal = false"
            />
          </div>
        </div>

        <BottomNavBar
          class="d-md-none"
          :fleetOpen="mobileFleetOpen"
          :layersOpen="mobileLayersOpen"
          @toggle-join-game="toggleJoinGame"
          @toggle-leaderboard="toggleLeaderboard"
          @toggle-reference-modal="toggleReferenceModal"
          @toggle-event-log-modal="toggleEventLogModal"
          @toggle-fleet="toggleMobileFleet"
          @toggle-layers="toggleMobileLayers"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useGalaxyStore } from "../stores/galaxy";
import { useSocketStore } from "../stores/socket";
import { useMovementStore } from "../stores/movement";
import { useCombatStore } from "../stores/combat";
import { useMapSettingsStore } from "../stores/mapSettings";
import HexMap from "../components/HexMap.vue";
import HeaderBar from "../components/layout/HeaderBar.vue";
import LeftSidebar from "../components/layout/LeftSidebar.vue";
import BottomNavBar from "../components/layout/BottomNavBar.vue";
import JoinGameModal from "../components/modals/JoinGameModal.vue";
import LeaderboardModal from "../components/modals/LeaderboardModal.vue";
import ReferenceModal from "../components/modals/ReferenceModal.vue";
import EventLogModal from "../components/modals/EventLogModal.vue";
import RightSidebar from "../components/layout/RightSidebar.vue";
import SelectionPanel from "../components/layout/SelectionPanel.vue";
import MovementPanel from "../components/layout/MovementPanel.vue";
import AttackPanel from "../components/layout/AttackPanel.vue";
import MapOverlayButtons from "../components/layout/MapOverlayButtons.vue";
import { GameStates } from "@solaris-command/core/src/types/game";

const route = useRoute();
const galaxyStore = useGalaxyStore();
const socketStore = useSocketStore();
const movementStore = useMovementStore();
const combatStore = useCombatStore();
const mapSettingsStore = useMapSettingsStore();
const { stage: stageState } = storeToRefs(mapSettingsStore);

const stageContainer = ref<HTMLDivElement | null>(null);

const showJoinGame = ref(false);
const showLeaderboard = ref(false);
const showReferenceModal = ref(false);
const showEventLogModal = ref(false);

const mobileFleetOpen = ref(false);
const mobileLayersOpen = ref(false);

const toggleJoinGame = () => {
  showLeaderboard.value = false;
  showReferenceModal.value = false;
  showEventLogModal.value = false;
  showJoinGame.value = !showJoinGame.value;
};

const toggleLeaderboard = () => {
  showJoinGame.value = false;
  showReferenceModal.value = false;
  showEventLogModal.value = false;
  showLeaderboard.value = !showLeaderboard.value;
};

const toggleReferenceModal = () => {
  showJoinGame.value = false;
  showLeaderboard.value = false;
  showEventLogModal.value = false;
  showReferenceModal.value = !showReferenceModal.value;
};

const toggleEventLogModal = () => {
  showJoinGame.value = false;
  showLeaderboard.value = false;
  showReferenceModal.value = false;
  showEventLogModal.value = !showEventLogModal.value;
};

const toggleMobileFleet = () => {
  mobileFleetOpen.value = !mobileFleetOpen.value;
  // If we open fleet, we might want to close layers
  if (mobileFleetOpen.value) {
    mobileLayersOpen.value = false;
  }
};

const toggleMobileLayers = () => {
  mobileLayersOpen.value = !mobileLayersOpen.value;
};

const stageConfig = computed(() => ({
  width: stageState.value.width,
  height: stageState.value.height,
  x: stageState.value.x,
  y: stageState.value.y,
  scaleX: stageState.value.scale,
  scaleY: stageState.value.scale,
  draggable: true,
}));

let resizeObserver: ResizeObserver;

onMounted(async () => {
  const gameId = route.params.id as string;

  if (stageContainer.value) {
    mapSettingsStore.stage.width = stageContainer.value.offsetWidth;
    mapSettingsStore.stage.height = stageContainer.value.offsetHeight;

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        mapSettingsStore.stage.width = entry.contentRect.width;
        mapSettingsStore.stage.height = entry.contentRect.height;
      }
    });

    resizeObserver.observe(stageContainer.value);
  }

  await galaxyStore.fetchGalaxy(gameId as any);

  // Connect to the websocket server
  socketStore.connect(gameId);

  // Center map roughly
  if (galaxyStore.galaxy) {
    mapSettingsStore.stage.x = mapSettingsStore.stage.width / 2;
    mapSettingsStore.stage.y = mapSettingsStore.stage.height / 2;
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
  socketStore.disconnect();
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

  mapSettingsStore.stage.scale = newScale;
  mapSettingsStore.stage.x =
    -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale;
  mapSettingsStore.stage.y =
    -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale;
}

function handleDragEnd(e: any) {
  mapSettingsStore.stage.x = e.target.x();
  mapSettingsStore.stage.y = e.target.y();
}
</script>

<style scoped>
#mapOverlayContainer,
#mapOverlayAllContainer {
  pointer-events: none; /* Allow clicks to pass through the overlay */
}

/* Re-enable pointer events for the content inside the columns */
#mapOverlayLeftSidebar > *,
#mapOverlayLeft > *,
#mapOverlayCenter > *,
#mapOverlayRight > *,
#mapOverlayAll > * {
  pointer-events: auto;
}

/* z-index-10 for the loading/error message needs to be explicitly defined if not available in bootstrap utilities */
.z-index-10 {
  z-index: 10;
}
</style>
