<script setup>
import { ref } from 'vue'
import { useThemeStore } from '../../stores/useThemeStore.js'
import { useToast } from '../../composables/useToast.js'

const themeStore = useThemeStore()
const state = themeStore.state
const { info } = useToast()

function setMode(m) {
  themeStore.setMode(m)
  const labels = { claro: 'Modo Claro', oscuro: 'Modo Oscuro', daltonico: 'Modo Daltonismo' }
  info(`${labels[m]} activado`)
}
</script>

<template>
  <div class="theme-switcher">
    <button
      v-for="m in ['claro','oscuro','daltonico']"
      :key="m"
      class="ts-btn"
      :class="{ active: state.mode === m }"
      @click="setMode(m)"
      :title="m === 'claro' ? 'Modo Claro' : m === 'oscuro' ? 'Modo Oscuro' : 'Modo Daltonismo'"
    >
      <span v-if="m === 'claro'">☀</span>
      <span v-if="m === 'oscuro'">🌙</span>
      <span v-if="m === 'daltonico'">◉</span>
    </button>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  gap: 0.2rem;
  background: var(--color-bg-page);
  border-radius: 50px;
  padding: 3px;
  border: 1px solid rgba(128,128,128,0.12);
}

.ts-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, transform 0.15s;
  color: var(--color-text-secondary);
}
.ts-btn:hover { background: rgba(128,128,128,0.1); transform: scale(1.1); }
.ts-btn.active {
  background: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transform: scale(1.05);
}
</style>
