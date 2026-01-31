import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)

app.use(createPinia())

app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

// Initialize auth store
const authStore = useAuthStore();
authStore.initialize();

app.use(router)
app.use(VueKonva)

app.mount('#app')
