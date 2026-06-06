import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTheme } from './stores/themeStore'

const app = createApp(App)

initTheme()
app.use(router)

app.mount('#app')
