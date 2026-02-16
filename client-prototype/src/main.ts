import { createApp } from "vue";
import { createPinia } from "pinia";
import VueKonva from "vue-konva";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import vue3GoogleLogin from "vue3-google-login";
import { FrontendConfig } from "@solaris-command/core/src/types/config";
import { configInjectionKey } from "@/utils/config.ts";

const init = (config: FrontendConfig) => {
  // --- OAUTH INTERCEPTOR ---
  // Check the "real" path before Vue Router even wakes up.
  // We need to do this because we have hash routing and OAuth does not allow hash routing.
  // So we should intercept the path first and check for OAuth callbacks.
  const pathname = window.location.pathname;
  if (pathname === "/auth/discord") {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code) {
      // Construct the Hash URL: /#/auth/discord?code=... and manually redirect the browser.
      window.location.href = `${window.location.origin}/#/auth/discord?code=${code}`;

      // CRITICAL: Return here. Do NOT mount the app.
      // This stops the router from loading and redirecting to #/login.
      // The browser will reload the page with the new URL immediately.
      throw new Error("Redirecting to Hash Route...");
    }
  }

  const app = createApp(App);

  app.provide(configInjectionKey, config);

  app.use(createPinia());

  app.use(vue3GoogleLogin, {
    clientId: config.googleClientId,
  });

  // Initialize auth store
  const authStore = useAuthStore();
  authStore.initialize();

  app.use(router);
  app.use(VueKonva);

  app.mount("#app");
};

fetch("/api/v1/config")
  .then((r) => r.json())
  .then((cfg) => init(cfg));
