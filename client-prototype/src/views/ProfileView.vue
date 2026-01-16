<template>
  <NavBar />

  <div id="content" class="app-content">
    <div class="container col-12 col-md-6 col-xl-4">
      <div class="mb-5" v-if="achievements">
        <div class="container">
          <div class="row">
            <div class="col text-center pt-2 pb-1 ps-1 pe-1 card">
              <h6>Rank</h6>
              <h4>
                <i class="fas fa-star text-info me-2"></i
                >{{ achievements.rank }}
              </h4>
              <div class="card-arrow">
                <div class="card-arrow-top-left"></div>
                <div class="card-arrow-top-right"></div>
                <div class="card-arrow-bottom-left"></div>
                <div class="card-arrow-bottom-right"></div>
              </div>
            </div>
            <div class="col text-center pt-2 pb-1 ps-1 pe-1 card">
              <h6>Victories</h6>
              <h4>
                <i class="fas fa-trophy text-warning me-2"></i
                >{{ achievements.victories }}
              </h4>
              <div class="card-arrow">
                <div class="card-arrow-top-left"></div>
                <div class="card-arrow-top-right"></div>
                <div class="card-arrow-bottom-left"></div>
                <div class="card-arrow-bottom-right"></div>
              </div>
            </div>
            <div class="col text-center pt-2 pb-1 ps-1 pe-1 card">
              <h6>Renown</h6>
              <h4>
                <i class="fas fa-heart text-danger me-2"></i
                >{{ achievements.renown }}
              </h4>
              <div class="card-arrow">
                <div class="card-arrow-top-left"></div>
                <div class="card-arrow-top-right"></div>
                <div class="card-arrow-bottom-left"></div>
                <div class="card-arrow-bottom-right"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-5">
        <h4><i class="far fa-user fa-fw text-theme"></i> Profile</h4>
        <p>View and update your general account information and settings.</p>
        <div class="card" v-if="authStore.user">
          <div class="list-group list-group-flush">
            <div class="list-group-item d-flex align-items-center">
              <div class="flex-1 text-break">
                <div>Username</div>
                <div class="text-inverse text-opacity-50">
                  {{ authStore.user.username }}
                </div>
              </div>
            </div>
            <div class="list-group-item d-flex align-items-center">
              <div class="flex-1 text-break">
                <div>Email address</div>
                <div class="text-inverse text-opacity-50">
                  {{ authStore.user.email }}
                </div>
              </div>
            </div>
            <div class="list-group-item d-flex align-items-center">
              <div class="flex-1 text-break">
                <div class="text-inverse text-opacity-50">
                  Log out of your account.
                </div>
              </div>
              <div>
                <button
                  @click="handleLogout"
                  class="btn btn-outline-warning w-100px"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
          <div class="card-arrow">
            <div class="card-arrow-top-left"></div>
            <div class="card-arrow-top-right"></div>
            <div class="card-arrow-bottom-left"></div>
            <div class="card-arrow-bottom-right"></div>
          </div>
        </div>
      </div>

      <div>
        <h4 class="text-danger">
          <i class="fa fa-warning fa-fw"></i> Danger Zone
        </h4>
        <div class="card">
          <div class="list-group list-group-flush">
            <div class="list-group-item d-flex align-items-center">
              <div class="flex-1 text-break">
                <div>Delete Account</div>
                <div class="text-inverse text-opacity-50">
                  This action will delete your account.
                </div>
              </div>
              <div>
                <button
                  @click="handleDelete"
                  class="btn btn-outline-danger w-100px"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          <div class="card-arrow">
            <div class="card-arrow-top-left"></div>
            <div class="card-arrow-top-right"></div>
            <div class="card-arrow-bottom-left"></div>
            <div class="card-arrow-bottom-right"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import NavBar from "../components/NavBar.vue";
import axios from "axios";
import { onMounted, ref } from "vue";
import { UserAchievements } from "@solaris-command/core";

const authStore = useAuthStore();
const router = useRouter();
const achievements = ref<UserAchievements | null>(null);

onMounted(async () => {
  try {
    const response = await axios.get("/api/v1/users/me");
    achievements.value = response.data.achievements;
  } catch (err: any) {
    console.error("Failed to fetch user achievements:", err.message);
  }
});

function handleLogout() {
  authStore.logout();
  router.push("/login");
}

async function handleDelete() {
  if (!confirm("Are you sure you want to delete your account?")) return;

  if (
    !confirm(
      "Really? Are you absolutely sure? This will delete all your data and cannot be undone."
    )
  )
    return;

  if (!confirm("Last chance?")) return;

  try {
    await axios.delete(`/api/v1/users/${authStore.user?._id}`);
    authStore.logout();
    router.push("/login");
  } catch (err: any) {
    alert("Failed to delete account: " + err.message);
  }
}
</script>

<style scoped></style>
