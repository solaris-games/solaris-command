<template>
  <div id="header" class="app-header">
    <!-- BEGIN brand -->
    <div class="brand">
      <router-link to="/games" class="brand-logo">
        <span class="brand-img" style="margin-right: 8px">
          <img src="/favicon_dark.ico" style="margin-left: 12px" />
        </span>
        <span class="brand-text text-success">SOLARIS: COMMAND</span>
      </router-link>
    </div>
    <!-- END brand -->

    <!-- BEGIN menu -->
    <div class="menu">
      <!-- <div class="menu-item">
        <router-link to="/games" class="menu-link">
          <span class="menu-text">Games</span>
        </router-link>
      </div> -->

      <div class="menu-item dropdown dropdown-mobile-full">
        <a
          href="#"
          data-bs-toggle="dropdown"
          data-bs-display="static"
          class="menu-link"
        >
          <div class="menu-img online">
            <div
              class="d-flex align-items-center justify-content-center w-100 h-100 bg-inverse bg-opacity-25 text-inverse text-opacity-50 rounded-circle overflow-hidden"
            >
              <i class="bi bi-person-fill fs-32px mb-n3"></i>
            </div>
          </div>
          <div class="menu-text d-sm-block d-none">
            {{ authStore.user?.username ?? "" }}
          </div>
        </a>
        <div class="dropdown-menu dropdown-menu-end me-lg-3 fs-11px mt-1">
          <router-link
            to="/profile"
            class="dropdown-item d-flex align-items-center"
          >
            <span>PROFILE</span
            ><i
              class="bi bi-person-circle ms-auto text-theme fs-16px my-n1"
            ></i>
          </router-link>

          <div class="dropdown-divider"></div>

          <a
            @click="handleLogout"
            class="dropdown-item d-flex align-items-center"
          >
            <span>LOGOUT</span>
            <i class="bi bi-toggle-off ms-auto text-theme fs-16px my-n1"></i>
          </a>
        </div>
      </div>
    </div>
    <!-- END menu -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const router = useRouter();

function handleLogout() {
  authStore.logout();
  router.push("/login");
}
</script>

<style scoped>
/* Prevent brand from being hidden on mobile */
@media (max-width: 767.98px) {
  .app-header .brand {
    display: flex;
  }

  .app-header .brand .brand-logo {
    display: flex;
  }
}
</style>
