<template>
  <NavBar />

  <div id="content" class="app-content">
    <div class="container col-12 col-md-8 col-xl-6">
      <h1 class="text-center">Games Lobby</h1>
      <p v-if="gameStore.error" class="text-danger">{{ gameStore.error }}</p>

      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'my-games' }"
            @click="activeTab = 'my-games'"
            >My Games</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'open-games' }"
            @click="activeTab = 'open-games'"
            >Open Games</a
          >
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'completed-games' }"
            @click="activeTab = 'completed-games'"
            >Completed Games</a
          >
        </li>
      </ul>

      <div class="tab-content">
        <div
          class="tab-pane"
          :class="{ active: activeTab === 'my-games' }"
          id="my-games"
        >
          <div>
            <div>
              <div v-if="myActiveGames.length === 0" class="text-center p-4">
                <p>You have not joined any games yet.</p>
                <p>
                  Why not
                  <a href="#" @click.prevent="activeTab = 'open-games'"
                    >join one of the open games</a
                  >?
                </p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Cycle</th>
                      <th scope="col" class="d-none d-md-table-cell">Status</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="game in myActiveGames"
                      :key="game._id"
                      @click="$router.push(`/games/${game._id}`)"
                      class="clickable"
                    >
                      <td>{{ game.name }}</td>
                      <td>{{ game.state.cycle }}</td>
                      <td class="d-none d-md-table-cell">
                        {{ game.state.status }}
                      </td>
                      <td align="right">
                        <button
                          @click.stop="$router.push(`/games/${game._id}`)"
                          class="btn btn-success btn-sm"
                          data-bs-toggle="tooltip"
                          title="Continue playing this game"
                        >
                          Play
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div
          class="tab-pane"
          :class="{ active: activeTab === 'open-games' }"
          id="open-games"
        >
          <div>
            <div>
              <div
                v-if="gameStore.openGames.length === 0"
                class="text-center p-4"
              >
                No open games found.
              </div>
              <div v-else class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Players</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="game in gameStore.openGames"
                      :key="game._id"
                      @click="$router.push(`/games/${game._id}`)"
                      class="clickable"
                    >
                      <td>{{ game.name }}</td>
                      <td>
                        {{ game.state.playerCount }} /
                        {{ game.settings.playerCount }}
                      </td>
                      <td align="right">
                        <button
                          @click.stop="$router.push(`/games/${game._id}`)"
                          class="btn btn-primary btn-sm"
                          v-tooltip="'View this game\'s details'"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div
          class="tab-pane"
          :class="{ active: activeTab === 'completed-games' }"
          id="completed-games"
        >
          <div>
            <div>
              <div v-if="myCompletedGames.length === 0" class="text-center p-4">
                No completed games found.
              </div>
              <div v-else class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Cycle</th>
                      <th scope="col" class="d-none d-md-table-cell">Status</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="game in myCompletedGames"
                      :key="game._id"
                      @click="$router.push(`/games/${game._id}`)"
                      class="clickable"
                    >
                      <td>{{ game.name }}</td>
                      <td>{{ game.state.cycle }}</td>
                      <td class="d-none d-md-table-cell">
                        {{ game.state.status }}
                      </td>
                      <td align="right">
                        <button
                          @click.stop="$router.push(`/games/${game._id}`)"
                          class="btn btn-info btn-sm"
                          v-tooltip="'View game'"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useGameStore } from "../stores/game";
import NavBar from "../components/NavBar.vue";
import { GameStates } from "@solaris-command/core";

const gameStore = useGameStore();
const activeTab = ref("my-games");

onMounted(async () => {
  await gameStore.fetchGames();
});

const myActiveGames = computed(() => {
  return gameStore.myGames.filter(
    (g) => g.state.status !== GameStates.COMPLETED
  );
});

const myCompletedGames = computed(() => {
  return gameStore.myGames.filter(
    (g) => g.state.status === GameStates.COMPLETED
  );
});
</script>

<style scoped>
.clickable {
  cursor: pointer;
}
.nav-tabs .nav-link {
  cursor: pointer;
}
.tab-content .tab-pane {
  display: none;
}
.tab-content .tab-pane.active {
  display: block;
}
</style>
