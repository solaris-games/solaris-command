import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())

// Initialize auth store
const authStore = useAuthStore();
authStore.initialize();

app.use(router)
app.use(VueKonva)

app.mount('#app')
