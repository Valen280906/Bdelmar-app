<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from './stores/useThemeStore.js'

const themeStore = useThemeStore()

onMounted(() => {
  // Cargar configuración guardada al iniciar
  themeStore.loadFromStorage()
})
</script>

<template>
  <router-view />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
</style>
