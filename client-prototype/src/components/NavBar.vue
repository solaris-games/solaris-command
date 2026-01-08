<template>
  <div id="header" class="app-header">
    <!-- BEGIN brand -->
    <div class="brand">
      <router-link to="/games" class="brand-logo">
        <span class="brand-img" style="margin-right: 8px;">
          <img src="/favicon_dark.ico" />
        </span>
        <span class="brand-text text-success">SOLARIS: COMMAND</span>
      </router-link>
    </div>
    <!-- END brand -->

    <!-- BEGIN menu -->
    <div class="menu">
      <div class="menu-item">
        <router-link to="/games" class="menu-link">
          <span class="menu-text">Games</span>
        </router-link>
      </div>

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
          <div class="menu-text d-sm-block d-none w-170px">
            username@account.com
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

          <router-link
            to="/settings"
            class="dropdown-item d-flex align-items-center"
          >
            <span>SETTINGS</span>
            <i class="bi bi-gear ms-auto text-theme fs-16px my-n1"></i>
          </router-link>

          <div class="dropdown-divider"></div>

          <router-link
            to="/settings"
            class="dropdown-item d-flex align-items-center"
          >
            <span>LOGOUT</span>
            <i class="bi bi-toggle-off ms-auto text-theme fs-16px my-n1"></i>
          </router-link>
        </div>
      </div>
    </div>
    <!-- END menu -->
  </div>
</template>
