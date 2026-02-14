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
