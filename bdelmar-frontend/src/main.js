// main.js – Punto de entrada de la aplicación
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'

// Importar tokens globales de diseño
import './assets/styles/tokens.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
