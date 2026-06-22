import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/styles/main.css'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/userStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const userStore = useUserStore()
userStore.init().finally(() => {
  app.mount('#app')
})
