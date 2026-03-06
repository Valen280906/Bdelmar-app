<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/useThemeStore.js'
import ToastContainer from './components/shared/ToastContainer.vue'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.loadFromStorage()
})
</script>

<template>
  <router-view />
  <ToastContainer />
</template>

<style>
/* Google Fonts: Merriweather (títulos/serif) + Inter (ui/sans-serif) */
@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');

/* Variables tipográficas predeterminadas */
:root {
  --font-family-heading: 'Merriweather', Georgia, serif;
  --font-family-body:    'Inter', system-ui, -apple-system, sans-serif;
  --radius-sm:   10px;
  --radius-md:   16px;
  --radius-pill: 50px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-family-body);
  background: var(--color-bg-page, #f0f2f5);
  color: var(--color-text-primary, #121212);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--font-family-heading);
  text-align: left;
}

/* Prevent text justification globally */
p, span, li, td, th { text-align: left; }
h1 { text-align: center; }

/* Scrollbar sutil */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: rgba(128,128,128,0.05); }
::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.4); }
</style>
