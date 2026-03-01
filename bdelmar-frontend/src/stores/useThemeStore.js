// stores/useThemeStore.js
// Pinia store central para paleta de colores y tipografía.
// Aplica cambios en tiempo real en document.documentElement (CSS custom properties).

import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

const PALETA_PRINCIPAL = {
  name: 'Frescura del Mar',
  colors: {
    primary:       '#1a91db',
    accent:        '#db8b1a',
    secondary:     '#3f8bba',
    bgPage:        '#f0f2f5',
    bgCard:        '#fafafa',
    textPrimary:   '#121212',
    textSecondary: '#2c3e50',
    imageBg:       '#d4dce4',
  }
}

const PALETA_OSCURA = {
  name: 'Modo Oscuro',
  colors: {
    primary:       '#249be5',
    accent:        '#e59524',
    secondary:     '#4590bf',
    bgPage:        '#121212',
    bgCard:        '#1e1e1e',
    textPrimary:   '#ededed',
    textSecondary: '#a0aab4',
    imageBg:       '#2a2a2a',
  }
}

const PALETA_DALTONICO = {
  name: 'Daltonismo',
  colors: {
    primary:       '#2BB0E6',
    accent:        '#db8b1a',
    secondary:     '#3f8bba',
    bgPage:        '#f0f2f5',
    bgCard:        '#fafafa',
    textPrimary:   '#121212',
    textSecondary: '#2c3e50',
    imageBg:       '#d4dce4',
  }
}

const TYPOGRAPHY_DEFAULT = {
  h1:   2.4,
  h2:   1.6,
  h3:   1.2,
  p:    1.0,
}

export const useThemeStore = defineStore('theme', () => {
  // --- Estado ---
  const state = reactive({
    mode: 'claro',           // 'claro' | 'oscuro' | 'daltonico'
    paletas: [
      { ...PALETA_PRINCIPAL, id: 1, active: true },
      { ...PALETA_OSCURA,    id: 2, active: false },
      { ...PALETA_DALTONICO, id: 3, active: false },
    ],
    currentColors: { ...PALETA_PRINCIPAL.colors },
    typography: { ...TYPOGRAPHY_DEFAULT },
    nextId: 4,
  })

  // --- Aplicar al DOM ---
  function applyToDom() {
    const r = document.documentElement.style

    // Colores
    r.setProperty('--color-primary',        state.currentColors.primary)
    r.setProperty('--color-accent',         state.currentColors.accent)
    r.setProperty('--color-secondary',      state.currentColors.secondary)
    r.setProperty('--color-bg-page',        state.currentColors.bgPage)
    r.setProperty('--color-bg-card',        state.currentColors.bgCard)
    r.setProperty('--color-text-primary',   state.currentColors.textPrimary)
    r.setProperty('--color-text-secondary', state.currentColors.textSecondary)
    r.setProperty('--color-image-bg',       state.currentColors.imageBg)

    // Sombras derivadas del color primario con opacidad
    const hex = state.currentColors.primary
    const rgb = hexToRgb(hex)
    if (rgb) {
      r.setProperty('--shadow-sm', `0 4px 12px rgba(${rgb}, 0.12)`)
      r.setProperty('--shadow-md', `0 8px 24px rgba(${rgb}, 0.18)`)
      r.setProperty('--shadow-lg', `0 20px 40px rgba(${rgb}, 0.22)`)
    }

    // Tipografía
    r.setProperty('--font-size-h1',   `${state.typography.h1}rem`)
    r.setProperty('--font-size-h2',   `${state.typography.h2}rem`)
    r.setProperty('--font-size-h3',   `${state.typography.h3}rem`)
    r.setProperty('--font-size-p',    `${state.typography.p}rem`)
    r.setProperty('--font-size-btn',  `${state.typography.p}rem`)   // igual al párrafo
    r.setProperty('--font-size-menu', `${state.typography.p}rem`)   // igual al párrafo
  }

  // --- Helpers ---
  function hexToRgb(hex) {
    const clean = hex.replace('#', '')
    if (clean.length !== 6) return null
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return `${r}, ${g}, ${b}`
  }

  // --- Acciones ---
  function setColor(key, value) {
    state.currentColors[key] = value
    applyToDom()
  }

  function setTypography(key, value) {
    state.typography[key] = value
    applyToDom()
  }

  function setMode(mode) {
    state.mode = mode
    if (mode === 'oscuro') {
      state.currentColors = { ...PALETA_OSCURA.colors }
    } else if (mode === 'daltonico') {
      state.currentColors = { ...PALETA_DALTONICO.colors }
    } else {
      // Claro: cargar la paleta activa
      const activa = state.paletas.find(p => p.active)
      if (activa) state.currentColors = { ...activa.colors }
      else state.currentColors = { ...PALETA_PRINCIPAL.colors }
    }
    applyToDom()
  }

  function activarPaleta(id) {
    state.paletas.forEach(p => p.active = (p.id === id))
    const activa = state.paletas.find(p => p.id === id)
    if (activa) {
      state.currentColors = { ...activa.colors }
      state.mode = 'claro'
    }
    applyToDom()
    persistToStorage()
  }

  function guardarPaletaActual(nombre) {
    const nueva = {
      id: state.nextId++,
      name: nombre || `Paleta ${state.nextId}`,
      active: false,
      colors: { ...state.currentColors }
    }
    state.paletas.push(nueva)
    persistToStorage()
  }

  function eliminarPaleta(id) {
    const idx = state.paletas.findIndex(p => p.id === id)
    if (idx !== -1 && !state.paletas[idx].active) {
      state.paletas.splice(idx, 1)
    }
    persistToStorage()
  }

  function persistToStorage() {
    try {
      localStorage.setItem('bdelmar_theme', JSON.stringify({
        paletas: state.paletas,
        currentColors: state.currentColors,
        typography: state.typography,
        mode: state.mode,
        nextId: state.nextId,
      }))
    } catch(e) { /* silent */ }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem('bdelmar_theme')
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.paletas)      state.paletas = saved.paletas
        if (saved.currentColors) state.currentColors = saved.currentColors
        if (saved.typography)   Object.assign(state.typography, saved.typography)
        if (saved.mode)         state.mode = saved.mode
        if (saved.nextId)       state.nextId = saved.nextId
      }
    } catch(e) { /* silent */ }
    applyToDom()
  }

  return {
    state,
    setColor,
    setTypography,
    setMode,
    activarPaleta,
    guardarPaletaActual,
    eliminarPaleta,
    loadFromStorage,
    applyToDom,
  }
})
